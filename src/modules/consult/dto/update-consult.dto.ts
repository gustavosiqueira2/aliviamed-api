import { IsOptional, IsString } from 'class-validator';

export class UpdateConsultDto {
  @IsOptional()
  @IsString()
  complaint?: string;

  @IsOptional()
  @IsString()
  evolution?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  prescription?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
