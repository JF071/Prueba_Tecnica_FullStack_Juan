import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './product.schema';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Habilitado = active distinto de false (incluye documentos antiguos que no tienen el campo). */
const ACTIVE: FilterQuery<Product> = { active: { $ne: false } };

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly model: Model<Product>) {}

  create(dto: CreateProductDto) {
    return this.model.create(dto);
  }

  async findAll({ page, limit, search, status }: ListProductsQueryDto) {
    const filter: FilterQuery<Product> = status === 'inactive' ? { active: false } : { ...ACTIVE };
    // Se escapa el texto: evita inyección de regex / NoSQL en la búsqueda
    if (search) filter.name = { $regex: escapeRegex(search), $options: 'i' };

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async findOne(id: string) {
    const product = await this.model.findById(id).lean().exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  /** Solo se editan productos habilitados. */
  async update(id: string, dto: UpdateProductDto) {
    const product = await this.model
      .findOneAndUpdate({ _id: id, ...ACTIVE }, { $set: dto }, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado o inhabilitado');
    return product;
  }

  /** Eliminación lógica: marca el producto como inhabilitado, no lo borra de la base. */
  async remove(id: string) {
    await this.setActive(id, false);
  }

  reactivate(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, active: boolean) {
    const product = await this.model.findByIdAndUpdate(id, { $set: { active } }, { new: true }).lean().exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
