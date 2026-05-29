import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ClinicGuard } from '../auth/strategies/clinic.guard';
import { CurrentClinic } from 'src/utils/decorators/current-clinic.decorator';
import { ConsultService } from './consult.service';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { UpdateConsultDto } from './dto/update-consult.dto';

@Controller('consult')
@UseGuards(JwtAuthGuard, ClinicGuard)
export class ConsultController {
  constructor(private readonly consultService: ConsultService) {}

  @Post('start/:appointmentId')
  start(
    @Param('appointmentId')
    appointmentId: string,

    @CurrentClinic()
    clinicId: string,
  ) {
    return this.consultService.start(appointmentId, clinicId);
  }

  @Get('appointment/:appointmentId')
  findOne(
    @Param('appointmentId') appointmentId: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.consultService.findByAppointment(appointmentId, clinicId);
  }

  @Get('active/me')
  findMyActiveConsultation(
    @CurrentUser('id')
    userId: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.consultService.findMyActiveConsult(userId, clinicId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentClinic()
    clinicId: string,
    @Body()
    body: UpdateConsultDto,
  ) {
    return this.consultService.update(id, clinicId, body);
  }

  @Post('finish/:consultId')
  finish(
    @Param('consultId')
    consultId: string,
    @CurrentClinic()
    clinicId: string,
  ) {
    return this.consultService.finish(consultId, clinicId);
  }
}
