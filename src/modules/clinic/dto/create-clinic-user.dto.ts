import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { ClinicRole } from 'src/utils/enum/clinic-role.enum';

export class CreateClinicUserDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name!: string;

  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @IsEnum(ClinicRole, {
    message: 'Role inválida',
  })
  role!: ClinicRole;
}
