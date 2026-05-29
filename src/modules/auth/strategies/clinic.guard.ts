import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtUser } from './jwt-user.interface';

@Injectable()
export class ClinicGuard implements CanActivate {
  constructor(
    @InjectRepository(UserClinic)
    private readonly userClinicRepository: Repository<UserClinic>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request & {
      user: JwtUser;
      clinicId?: string;
      headers: { 'x-clinic-id'?: string };
    } = context.switchToHttp().getRequest();

    const userId = request.user.id;

    if (!userId) {
      throw new ForbiddenException(['userId não informado']);
    }

    const clinicId = request.headers['x-clinic-id'];

    if (!clinicId) {
      throw new ForbiddenException(['ClinicId não informado']);
    }

    const exists = await this.userClinicRepository.findOne({
      where: {
        user: { id: userId },
        clinic: { id: clinicId },
        active: true,
      },
    });

    if (!exists) {
      throw new ForbiddenException(['Você não tem acesso a essa clínica']);
    }

    request.clinicId = clinicId;

    return true;
  }
}
