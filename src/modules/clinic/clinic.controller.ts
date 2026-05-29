import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClinicGuard } from 'src/modules/auth/strategies/clinic.guard';
import { JwtAuthGuard } from 'src/modules/auth/strategies/jwt-auth.guard';
import { CurrentClinic } from 'src/utils/decorators/current-clinic.decorator';
import { CurrentUser } from 'src/utils/decorators/current-user.decorator';
import { ClinicService } from './clinic.service';
import { CreateClinicUserDto } from './dto/create-clinic-user.dto';
import { DeactivateClinicUserDto } from './dto/deactivate-clinic-user.dto';
import { SearchProfessionalsDto } from './dto/search-professionals.dto';

@Controller('clinic')
@UseGuards(JwtAuthGuard, ClinicGuard)
export class ClinicController {
  constructor(private readonly clinicService: ClinicService) {}

  @Get('me')
  me(@CurrentClinic() clinicId: string) {
    return this.clinicService.getClinicDetails(clinicId);
  }

  @Post('users')
  createUser(
    @CurrentUser('id') userId: string,
    @CurrentClinic() clinicId: string,
    @Body()
    body: CreateClinicUserDto,
  ) {
    return this.clinicService.createUserInClinic(clinicId, userId, body);
  }

  @Get('professionals/search')
  searchProfessionals(
    @CurrentClinic()
    clinicId: string,
    @Query()
    query: SearchProfessionalsDto,
  ) {
    return this.clinicService.searchProfessionals(clinicId, query.name);
  }

  @Patch('users/deactivate')
  deactivateUser(
    @CurrentUser('id') userId: string,
    @CurrentClinic() clinicId: string,
    @Body()
    body: DeactivateClinicUserDto,
  ) {
    return this.clinicService.deactivateUser(userId, clinicId, body.id);
  }

  @Patch('users/activate')
  activateUser(
    @CurrentUser('id') userId: string,
    @CurrentClinic() clinicId: string,
    @Body()
    body: DeactivateClinicUserDto,
  ) {
    return this.clinicService.activateUser(userId, clinicId, body.id);
  }
}
