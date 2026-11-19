import {
  Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ParseObjectIdPipe } from '../common/parse-object-id.pipe';
import { CreateProductDto, ListProductsQueryDto, UpdateProductDto } from './dto/product.dto';
import { StockExitDto } from './dto/stock-exit.dto';
import { ProductsService } from './products.service';

@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard) // todos los endpoints del controlador exigen JWT
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get()
  findAll(@Query() query: ListProductsQueryDto) {
    return this.products.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.products.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.products.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Despublica el producto de la tienda (eliminación lógica: no se borra de la base)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.products.remove(id);
  }

  @Post(':id/salidas')
  @HttpCode(200)
  @ApiOperation({ summary: 'Registra una venta (salida de inventario): descuenta cantidad × factor de la presentación' })
  registerExit(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: StockExitDto) {
    return this.products.registerExit(id, dto);
  }

  @Patch(':id/reactivar')
  @ApiOperation({ summary: 'Vuelve a publicar un producto despublicado' })
  reactivate(@Param('id', ParseObjectIdPipe) id: string) {
    return this.products.reactivate(id);
  }
}
