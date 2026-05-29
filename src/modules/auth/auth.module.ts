import { Module } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { JwtStrategy } from './strategies/jwt.strategy';

import { User } from 'src/modules/user/entities/user.entity';
import { Auth } from './entities/auth.entity';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Clinic } from 'src/modules/clinic/entities/clinic.entity';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User, Clinic, UserClinic]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
