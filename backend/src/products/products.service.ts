import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { StockExitDto } from './dto/stock-exit.dto';
import { Presentation, Product } from './product.schema';

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

  /**
   * Descuenta del stock: cantidad × factor de la presentación.
   * El descuento es ATÓMICO: el filtro `stock >= amount` y el `$inc` van en la misma
   * operación, así dos ventas simultáneas nunca dejan el stock en negativo.
   */
  async registerExit(id: string, { presentationId, quantity }: StockExitDto) {
    const product = await this.model.findOne({ _id: id, ...ACTIVE }).lean().exec();
    if (!product) throw new NotFoundException('Producto no encontrado o inhabilitado');

    // Mongo asigna un _id a cada subdocumento embebido; con él se identifica la presentación
    const presentations = product.presentations as (Presentation & { _id: unknown })[];
    const presentation = presentations.find((p) => String(p._id) === presentationId);
    if (!presentation) throw new BadRequestException('La presentación no pertenece a este producto');

    // Redondeo a 3 decimales para evitar errores de coma flotante (0.1 × 3 = 0.30000000000000004)
    const amount = Math.round(presentation.factor * quantity * 1000) / 1000;

    const updated = await this.model
      .findOneAndUpdate({ _id: id, ...ACTIVE, stock: { $gte: amount } }, { $inc: { stock: -amount } }, { new: true })
      .lean()
      .exec();
    if (!updated) {
      throw new ConflictException(
        `Stock insuficiente: se requieren ${amount} ${product.baseUnit} y hay ${product.stock} ${product.baseUnit}`,
      );
    }
    return { product: updated, deducted: amount };
  }

  private async setActive(id: string, active: boolean) {
    const product = await this.model.findByIdAndUpdate(id, { $set: { active } }, { new: true }).lean().exec();
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }
}
