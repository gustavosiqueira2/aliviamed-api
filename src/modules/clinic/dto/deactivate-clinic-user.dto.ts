import { IsNotEmpty } from 'class-validator';

export class DeactivateClinicUserDto {
  @IsNotEmpty({ message: 'Id do usuário é obrigatório' })
  id!: string;
}
