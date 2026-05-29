import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Patient } from './entities/patient.entity';
import { PatientService } from './patient.service';
import { PatientController } from './patient.controller';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';
import { Appointment } from '../appointment/entities/appointment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, UserClinic, Appointment])],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}
