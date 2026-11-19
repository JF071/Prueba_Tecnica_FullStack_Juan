import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { Product } from './product.schema';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class ProductsService {
  constructor(@InjectModel(Product.name) private readonly model: Model<Product>) {}

  create(dto: CreateProductDto) {
    return this.model.create(dto);
  }

  async findAll({ page, limit, search }: ListProductsQueryDto) {
    // Se escapa el texto: evita inyección de regex / NoSQL en la búsqueda
    const filter = search ? { name: { $regex: escapeRegex(search), $options: 'i' } } : {};
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

  async update(id: string, dto: UpdateProductDto) {
    const product = await this.model
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Producto no encontrado');
  }
}
