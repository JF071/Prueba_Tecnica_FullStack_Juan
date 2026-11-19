import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Unidades base en las que se mide el inventario.
 * Peso: kg, g, t, lb, arroba (12,5 kg) · Volumen: L, mL, gal · Conteo: und
 */
export const BASE_UNITS = ['kg', 'g', 't', 'lb', 'arroba', 'L', 'mL', 'gal', 'und'] as const;
export type BaseUnit = (typeof BASE_UNITS)[number];

/**
 * Forma en que se vende el producto, p. ej. "Bulto 50 kg".
 * factor = cuántas unidades base contiene (50 si la unidad base es kg).
 * Al vender 1 presentación se descuentan `factor` unidades del stock.
 */
@Schema()
export class Presentation {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  factor: number;

  @Prop({ required: true, min: 0 })
  price: number;
}
export const PresentationSchema = SchemaFactory.createForClass(Presentation);

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ trim: true, default: '' })
  description: string;

  @Prop({ trim: true, default: 'general' })
  category: string;

  @Prop({ required: true, enum: BASE_UNITS, default: 'und' })
  baseUnit: BaseUnit;

  /** Existencias expresadas en la unidad base (admite decimales: 12.5 kg) */
  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  /** Embebidas: siempre se consultan junto con el producto */
  @Prop({ type: [PresentationSchema], default: [] })
  presentations: Presentation[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);
