import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/** Quita espacios al inicio y al final antes de validar ("   " pasa a ""). */
const Trim = () => Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

export class CreateProductDto {
  @ApiProperty({ example: 'Fertilizante orgánico 25kg' })
  @Trim()
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'Bulto de 25 kg' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 85000, minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 40, minimum: 0 })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 'insumos' })
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(60)
  category?: string;
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
