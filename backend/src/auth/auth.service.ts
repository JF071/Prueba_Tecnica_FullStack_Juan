import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CredentialsDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register({ email, password }: CredentialsDto) {
    const hash = await bcrypt.hash(password, 10);
    const user = await this.users.create(email, hash);
    return { id: user.id, email: user.email };
  }

  async login({ email, password }: CredentialsDto) {
    const user = await this.users.findByEmail(email);
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    // Mismo mensaje para correo o clave incorrectos: no revela qué falló
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');
    return { accessToken: await this.jwt.signAsync({ sub: user.id, email: user.email }) };
  }
}
