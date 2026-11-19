import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateProductDto, UpdateProductDto } from './product.dto';

// Reproduce lo que hace el ValidationPipe global (transform: true)
const check = async <T extends object>(cls: new () => T, body: object) => {
  const dto = plainToInstance(cls, body);
  return { dto, errors: await validate(dto) };
};

const valid = { name: 'Semilla de maíz', price: 1000, stock: 5 };

describe('CreateProductDto', () => {
  it('acepta un producto válido y quita espacios sobrantes', async () => {
    const { dto, errors } = await check(CreateProductDto, { ...valid, name: '  Semilla de maíz  ' });
    expect(errors).toHaveLength(0);
    expect(dto.name).toBe('Semilla de maíz');
  });

  it('rechaza un nombre con solo espacios (antes llegaba a Mongo y daba 500)', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, name: '   ' });
    expect(errors[0].constraints).toHaveProperty('isNotEmpty', 'El nombre es obligatorio');
  });

  it('rechaza precio negativo y stock decimal', async () => {
    const { errors } = await check(CreateProductDto, { ...valid, price: -1, stock: 1.5 });
    expect(errors.map((e) => e.property).sort()).toEqual(['price', 'stock']);
  });
});

describe('UpdateProductDto', () => {
  it('también rechaza vaciar el nombre al editar', async () => {
    const { errors } = await check(UpdateProductDto, { name: '  ' });
    expect(errors).toHaveLength(1);
  });
});
