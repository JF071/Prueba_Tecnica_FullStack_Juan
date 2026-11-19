import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/cors';
import { MongoExceptionFilter } from './common/mongo-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  // Solo los orígenes de la lista pueden llamar a la API desde el navegador
  app.enableCors({ origin: parseCorsOrigins(process.env.CORS_ORIGIN) });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos no declarados en el DTO
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new MongoExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('API de Productos')
    .setDescription('CRUD de productos protegido con JWT')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
