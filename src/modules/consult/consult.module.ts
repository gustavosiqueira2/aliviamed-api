import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Consult } from './entities/consult.entity';
import { Appointment } from '../appointment/entities/appointment.entity';
import { ConsultController } from './consult.controller';
import { ConsultService } from './consult.service';
import { UserClinic } from '../clinic/entities/user-clinic.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserClinic, Consult, Appointment])],
  controllers: [ConsultController],
  providers: [ConsultService],
})
export class ConsultModule {}
