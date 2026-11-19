import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString,
  Max, MaxLength, Min, ValidateNested,
} from 'class-validator';
import { BASE_UNITS, BaseUnit } from '../product.schema';

/** Quita espacios al inicio y al final antes de validar ("   " pasa a ""). */
const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class PresentationDto {
  @ApiProperty({ example: 'Bulto 50 kg' })
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la presentación es obligatorio' })
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 50, description: 'Unidades base que contiene (50 kg en un bulto de 50 kg)' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive({ message: 'El factor de la presentación debe ser mayor que 0' })
  factor: number;

  @ApiProperty({ example: 145000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Urea granulada 46%' })
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Fertilizante nitrogenado' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'fertilizantes' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiProperty({ enum: BASE_UNITS, example: 'kg' })
  @IsIn(BASE_UNITS, { message: `La unidad base debe ser una de: ${BASE_UNITS.join(', ')}` })
  baseUnit: BaseUnit;

  @ApiProperty({ example: 1250, minimum: 0, description: 'Existencias en la unidad base' })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stock: number;

  @ApiProperty({ type: [PresentationDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Agrega al menos una presentación' })
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => PresentationDto)
  presentations: PresentationDto[];
}

export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class ListProductsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ description: 'Búsqueda por nombre' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  search?: string;
}
