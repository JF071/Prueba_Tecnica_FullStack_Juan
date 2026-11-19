import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Error as MongooseError, mongo } from 'mongoose';

/**
 * Traduce errores de MongoDB/Mongoose a respuestas HTTP claras.
 * Sin este filtro, Nest los trata como errores desconocidos y responde 500.
 */
@Catch(mongo.MongoServerError, MongooseError.ValidationError)
export class MongoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MongoExceptionFilter.name);

  catch(exception: mongo.MongoServerError | MongooseError.ValidationError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    // Validación del esquema (respaldo por si algo se salta los DTO)
    if (exception instanceof MongooseError.ValidationError) {
      const message = Object.values(exception.errors).map((e) => e.message);
      return res.status(400).json({ statusCode: 400, message, error: 'Bad Request' });
    }

    // Índice único violado, p. ej. dos registros simultáneos con el mismo correo
    if (exception.code === 11000) {
      return res.status(409).json({ statusCode: 409, message: 'Ya existe un registro con esos datos', error: 'Conflict' });
    }

    // Cualquier otro error de la base: se registra, pero no se exponen detalles al cliente
    this.logger.error(exception.message);
    return res.status(500).json({ statusCode: 500, message: 'Internal server error' });
  }
}
