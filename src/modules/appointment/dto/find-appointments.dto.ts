import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsPositive,
  IsUUID,
  Max,
} from 'class-validator';

import { Type } from 'class-transformer';
import { AppointmentStatus } from 'src/utils/enum/appointment-status.enum';

export class FindAppointmentsDto {
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(25)
  limit?: number = 10;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  @IsUUID()
  professionalId?: string;
}
