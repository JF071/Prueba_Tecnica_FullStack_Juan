import { NotFoundException } from '@nestjs/common';
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

  it('pagina y calcula totalPages', async () => {
    model.find = jest.fn(() => chain([{ name: 'a' }]));
    model.countDocuments = jest.fn(() => chain(25));
    const res = await service.findAll({ page: 2, limit: 10 });
    expect(res).toMatchObject({ total: 25, page: 2, limit: 10, totalPages: 3 });
  });

  it('escapa caracteres especiales en la búsqueda', async () => {
    model.find = jest.fn(() => chain([]));
    model.countDocuments = jest.fn(() => chain(0));
    await service.findAll({ page: 1, limit: 10, search: '.*(' });
    expect(model.find).toHaveBeenCalledWith({ name: { $regex: '\\.\\*\\(', $options: 'i' } });
  });

  it('findOne lanza 404 si no existe', async () => {
    model.findById = jest.fn(() => chain(null));
    await expect(service.findOne('x')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update lanza 404 si no existe', async () => {
    model.findByIdAndUpdate = jest.fn(() => chain(null));
    await expect(service.update('x', { price: 1 })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove lanza 404 si no existe', async () => {
    model.findByIdAndDelete = jest.fn(() => chain(null));
    await expect(service.remove('x')).rejects.toBeInstanceOf(NotFoundException);
  });
});
