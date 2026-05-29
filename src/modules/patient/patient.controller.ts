import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { JwtAuthGuard } from 'src/modules/auth/strategies/jwt-auth.guard';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { ClinicGuard } from 'src/modules/auth/strategies/clinic.guard';
import { CurrentClinic } from 'src/utils/decorators/current-clinic.decorator';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { SearchPatientsDto } from './dto/search-patients.dto';

@Controller('patient')
@UseGuards(JwtAuthGuard, ClinicGuard)
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Post()
  create(
    @Body() body: CreatePatientDto,
    @CurrentUser('id') userId: string,
    @CurrentClinic() clinicId: string,
  ) {
    return this.patientService.create(body, userId, clinicId);
  }

  @Get()
  findAll(
    @CurrentClinic() clinicId: string,
    @Query()
    query: {
      page?: number;
      limit?: number;
      name?: string;
    },
  ) {
    return this.patientService.findAll(clinicId, query);
  }

  @Get('search')
  search(
    @CurrentClinic()
    clinicId: string,
    @Query()
    query: SearchPatientsDto,
  ) {
    return this.patientService.search(clinicId, query.name);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentClinic() clinicId: string) {
    return this.patientService.findOne(id, clinicId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentClinic() clinicId: string,
    @Body() body: UpdatePatientDto,
  ) {
    return this.patientService.update(id, clinicId, body);
  }
}
