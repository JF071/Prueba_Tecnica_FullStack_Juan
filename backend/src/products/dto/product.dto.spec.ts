import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, UpdateProductDto } from './product.dto';

// Reproduce lo que hace el ValidationPipe global (transform: true)
const check = async <T extends object>(cls: new () => T, body: object) => {
  const dto = plainToInstance(cls, body);
  return { dto, errors: await validate(dto) };
};

const valid = {
  name: 'Urea granulada 46%',
  supplier: 'Agroinsumos del Valle',
  baseUnit: 'kg',
  stock: 1250.5,
  presentations: [
    { name: 'Bulto 50 kg', factor: 50, price: 145000 },
    { name: 'Kilo', factor: 1, price: 3400 },
  ],
};

describe('CreateProductDto', () => {
  it('acepta un producto válido (stock con decimales) y quita espacios sobrantes', async () => {
    const { dto, errors } = await check(CreateProductDto, { ...valid, name: '  Urea granulada 46%  ' });
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Urea granulada 46%');
  });

  it('rechaza un nombre con solo espacios (antes llegaba a Mongo y daba 500)', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, name: '   ' });
    expect(errors[0].constraints).toHaveProperty('isNotEmpty', 'El nombre es obligatorio');
  });

  it('exige el proveedor (marketplace con varios vendedores)', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, supplier: '  ' });
    expect(errors[0].constraints).toHaveProperty('isNotEmpty', 'El proveedor es obligatorio');
  });

  it('rechaza una unidad base que no está en la lista', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, baseUnit: 'cucharada' });
    expect(errors.map((e) => e.property)).toEqual(['baseUnit']);
  });

  it('exige al menos una presentación', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, presentations: [] });
    expect(errors[0].constraints).toHaveProperty('arrayMinSize', 'Agrega al menos una presentación');
  });

  it('valida cada presentación: factor > 0 y precio >= 0', async () => {
    const { errors } = await check(CreateProductDto, {
      ...valid,
      presentations: [{ name: 'Bulto', factor: 0, price: -1 }],
    });
    const nested = errors[0].children![0].children!.map((e) => e.property).sort();
    expect(nested).toEqual(['factor', 'price']);
  });
});

describe('UpdateProductDto', () => {
  it('permite actualizar solo un campo', async () => {
    const { errors } = await check(UpdateProductDto, { stock: 10 });
    expect(errors).toHaveLength(0);
  });

  it('también rechaza vaciar el nombre al editar', async () => {
    const { errors } = await check(UpdateProductDto, { name: '  ' });
    expect(errors).toHaveLength(1);
  });
});
