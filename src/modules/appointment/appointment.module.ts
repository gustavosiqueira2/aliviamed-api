import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from 'src/modules/patient/entities/patient.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';
import { Appointment } from './entities/appointment.entity';
import { UserClinic } from '../clinic/entities/user-clinic.entity';
import { Clinic } from '../clinic/entities/clinic.entity';
import { Consult } from '../consult/entities/consult.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      User,
      Patient,
      UserClinic,
      Clinic,
      Consult,
    ]),
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
