import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from './product.schema';
import { ProductsService } from './products.service';

const chain = (result: unknown) => ({
  sort: () => chain(result), skip: () => chain(result), limit: () => chain(result),
  lean: () => chain(result), exec: () => Promise.resolve(result),
});

describe('ProductsService', () => {
  let service: ProductsService;
  const model: any = {};

  beforeEach(async () => {
    Object.keys(model).forEach((k) => delete model[k]);
    const mod = await Test.createTestingModule({
      providers: [ProductsService, { provide: getModelToken(Product.name), useValue: model }],
    }).compile();
    service = mod.get(ProductsService);
  });

  const mockList = (items: unknown[], total: number) => {
    model.find = jest.fn(() => chain(items));
    model.countDocuments = jest.fn(() => chain(total));
  };

  it('pagina y calcula totalPages', async () => {
    mockList([{ name: 'a' }], 25);
    const res = await service.findAll({ page: 2, limit: 10, status: 'active' });
    expect(res).toMatchObject({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it('por defecto lista solo habilitados (incluye documentos sin el campo active)', async () => {
    mockList([], 0);
    await service.findAll({ page: 1, limit: 10, status: 'active' });
    expect(model.find).toHaveBeenCalledWith({ active: { $ne: false } });
  });

  it('con status=inactive lista solo los inhabilitados', async () => {
    mockList([], 0);
    await service.findAll({ page: 1, limit: 10, status: 'inactive' });
    expect(model.find).toHaveBeenCalledWith({ active: false });
  });

  it('escapa caracteres especiales en la búsqueda', async () => {
    mockList([], 0);
    await service.findAll({ page: 1, limit: 10, search: '.*(', status: 'active' });
    expect(model.find).toHaveBeenCalledWith({ active: { $ne: false }, name: { $regex: '\\.\\*\\(', $options: 'i' } });
  });

  it('findOne lanza 404 si no existe', async () => {
    model.findById = jest.fn(() => chain(null));
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update solo modifica productos habilitados y lanza 404 si no hay', async () => {
    model.findOneAndUpdate = jest.fn(() => chain(null));
    await expect(service.update('x', { stock: 1 })).rejects.toBeInstanceOf(NotFoundException);
    expect(model.findOneAndUpdate.mock.calls[0][0]).toEqual({ _id: 'x', active: { $ne: false } });
  });

  it('remove NO borra: marca active=false (eliminación lógica)', async () => {
    model.findByIdAndUpdate = jest.fn(() => chain({ _id: 'x', active: false }));
    model.findByIdAndDelete = jest.fn();
    await service.remove('x');
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith('x', { $set: { active: false } }, { new: true });
    expect(model.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it('reactivate marca active=true', async () => {
    model.findByIdAndUpdate = jest.fn(() => chain({ _id: 'x', active: true }));
    await expect(service.reactivate('x')).resolves.toMatchObject({ active: true });
  });

  describe('registerExit (salidas de inventario)', () => {
    const PRES_ID = '665f1c2b9d3e4a0012345678';
    const urea = {
      _id: 'p1', baseUnit: 'kg', stock: 120, active: true,
      presentations: [{ _id: PRES_ID, name: 'Bulto 50 kg', factor: 50, price: 145000 }],
    };

    it('descuenta cantidad × factor de forma atómica (filtro stock >= cantidad + $inc)', async () => {
      model.findOne = jest.fn(() => chain(urea));
      model.findOneAndUpdate = jest.fn(() => chain({ ...urea, stock: 20 }));
      const res = await service.registerExit('p1', { presentationId: PRES_ID, quantity: 2 });
      expect(model.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'p1', active: { $ne: false }, stock: { $gte: 100 } },
        { $inc: { stock: -100 } },
        { new: true },
      );
      expect(res).toMatchObject({ deducted: 100, product: { stock: 20 } });
    });

    it('responde 409 si no hay stock suficiente (la operación atómica no encontró documento)', async () => {
      model.findOne = jest.fn(() => chain(urea));
      model.findOneAndUpdate = jest.fn(() => chain(null));
      await expect(service.registerExit('p1', { presentationId: PRES_ID, quantity: 3 }))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('responde 400 si la presentación no es de ese producto', async () => {
      model.findOne = jest.fn(() => chain(urea));
      await expect(service.registerExit('p1', { presentationId: '665f1c2b9d3e4a00ffffffff', quantity: 1 }))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('responde 404 si el producto no existe o está inhabilitado', async () => {
      model.findOne = jest.fn(() => chain(null));
      await expect(service.registerExit('p1', { presentationId: PRES_ID, quantity: 1 }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('redondea para evitar errores de coma flotante (0,1 × 3 = 0,3)', async () => {
      model.findOne = jest.fn(() => chain({ ...urea, presentations: [{ _id: PRES_ID, name: 'Sobre 100 g', factor: 0.1, price: 500 }] }));
      model.findOneAndUpdate = jest.fn(() => chain(urea));
      const res = await service.registerExit('p1', { presentationId: PRES_ID, quantity: 3 });
      expect(res.deducted).toBe(0.3);
    });
  });

  it('remove lanza 404 si no existe', async () => {
    model.findByIdAndUpdate = jest.fn(() => chain(null));
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
