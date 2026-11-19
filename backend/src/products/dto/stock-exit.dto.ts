import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsMongoId, Max, Min } from 'class-validator';

/** Venta (salida de inventario): "vender 2 × Bulto 50 kg" descuenta 100 kg. */
export class StockExitDto {
  @ApiProperty({ description: 'Id de la presentación que se vende (de product.presentations)' })
  @IsMongoId({ message: 'La presentación no es válida' })
  presentationId: string;

  @ApiProperty({ example: 2, minimum: 1, description: 'Cuántas presentaciones salen' })
  @IsInt({ message: 'La cantidad debe ser un número entero' })
  @Min(1, { message: 'La cantidad debe ser al menos 1' })
  @Max(100000)
  quantity: number;
}
