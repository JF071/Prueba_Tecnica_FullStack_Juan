import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const jwt: any = { signAsync: jest.fn().mockResolvedValue('token') };
  const users: any = { findByEmail: jest.fn(), create: jest.fn() };
  const service = new AuthService(users, jwt);

  it('login correcto devuelve token', async () => {
    users.findByEmail.mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: await bcrypt.hash('Clave12345', 4) });
    await expect(service.login({ email: 'a@a.com', password: 'Clave12345' })).resolves.toEqual({ accessToken: 'token' });
  });

  it('clave incorrecta y usuario inexistente dan el mismo error', async () => {
    users.findByEmail.mockResolvedValue({ id: '1', email: 'a@a.com', passwordHash: await bcrypt.hash('otra', 4) });
    await expect(service.login({ email: 'a@a.com', password: 'Clave12345' })).rejects.toBeInstanceOf(UnauthorizedException);
    users.findByEmail.mockResolvedValue(null);
    await expect(service.login({ email: 'x@a.com', password: 'Clave12345' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('register no guarda la clave en texto plano', async () => {
    users.create.mockImplementation(async (email: string, hash: string) => ({ id: '2', email, hash }));
    await service.register({ email: 'b@b.com', password: 'Clave12345' });
    expect(users.create.mock.calls[0][1]).not.toBe('Clave12345');
  });
});
