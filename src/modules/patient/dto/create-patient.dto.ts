import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePatientDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @IsDateString({}, { message: 'Data de nascimento inválida' })
  birthdate!: string;
}
