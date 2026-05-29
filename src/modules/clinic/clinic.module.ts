import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClinicController } from './clinic.controller';
import { ClinicService } from './clinic.service';
import { Clinic } from './entities/clinic.entity';
import { UserClinic } from './entities/user-clinic.entity';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auth, User, Clinic, UserClinic, Appointment]),
  ],
  controllers: [ClinicController],
  providers: [ClinicService],
})
export class ClinicModule {}
