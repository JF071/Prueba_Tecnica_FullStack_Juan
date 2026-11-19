import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CredentialsDto {
  @ApiProperty({ example: 'usuario@correo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'ClaveSegura123', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // límite real de bcrypt
  password: string;
}
