import { Logger } from '@nestjs/common';
import { Error as MongooseError, mongo } from 'mongoose';
import { MongoExceptionFilter } from './mongo-exception.filter';

// Respuesta HTTP simulada que guarda el status y el cuerpo enviados
const fakeHost = () => {
  const res: any = { status: jest.fn(() => res), json: jest.fn(() => res) };
  const host: any = { switchToHttp: () => ({ getResponse: () => res }) };
  return { res, host };
};

describe('MongoExceptionFilter', () => {
  const filter = new MongoExceptionFilter();

  it('correo duplicado (E11000) responde 409', () => {
    const { res, host } = fakeHost();
    filter.catch(new mongo.MongoServerError({ code: 11000, errmsg: 'E11000 duplicate key' }), host);
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('error de validación de Mongoose responde 400 con los mensajes', () => {
    const { res, host } = fakeHost();
    const err = new MongooseError.ValidationError();
    err.addError('price', new MongooseError.ValidatorError({ message: 'price debe ser >= 0' }));
    filter.catch(err, host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: ['price debe ser >= 0'] }));
  });

  it('otros errores de Mongo responden 500 sin filtrar detalles', () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { res, host } = fakeHost();
    filter.catch(new mongo.MongoServerError({ code: 2, errmsg: 'detalle interno' }), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(JSON.stringify(res.json.mock.calls[0][0])).not.toContain('detalle interno');
  });
});
