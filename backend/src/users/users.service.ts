import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email: email.toLowerCase() }).exec();
  }

  async create(email: string, passwordHash: string): Promise<UserDocument> {
    if (await this.findByEmail(email)) {
      throw new ConflictException('El correo ya está registrado');
    }
    return this.model.create({ email, passwordHash });
  }
}
