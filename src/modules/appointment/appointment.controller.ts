import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ClinicGuard } from '../auth/strategies/clinic.guard';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CurrentClinic } from 'src/utils/decorators/current-clinic.decorator';
import { AppointmentService } from './appointment.service';
import { RescheduleAppointmentDto } from './entities/reschedule-appointment.dto';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { FindAppointmentsDto } from './dto/find-appointments.dto';

@Controller('appointment')
@UseGuards(JwtAuthGuard, ClinicGuard)
export class AppointmentController {
  constructor(private readonly appointmentService: AppointmentService) {}

  @Post()
  create(
    @Body() body: CreateAppointmentDto,
    @CurrentClinic() clinicId: string,
  ) {
    return this.appointmentService.create(body, clinicId);
  }

  @Get()
  findAll(
    @CurrentClinic()
    clinicId: string,
    @Query()
    query: FindAppointmentsDto,
  ) {
    return this.appointmentService.findAll(clinicId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentClinic() clinicId: string) {
    return this.appointmentService.findOne(id, clinicId);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Body()
    body: RescheduleAppointmentDto,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.reschedule(id, clinicId, body);
  }

  @Patch(':id/confirm')
  confirm(
    @Param('id') id: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.confirm(id, clinicId);
  }

  @Patch(':id/waiting-consultation')
  waitingConsultation(
    @Param('id') id: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.waitingConsultation(id, clinicId);
  }

  @Patch(':id/complete')
  complete(
    @Param('id') id: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.complete(id, clinicId);
  }

  @Patch(':id/no-show')
  noShow(
    @Param('id') id: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.noShow(id, clinicId);
  }

  @Patch(':id/cancel')
  cancel(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.appointmentService.cancel(id, userId, clinicId);
  }
}
