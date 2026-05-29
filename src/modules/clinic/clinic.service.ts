import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Clinic } from './entities/clinic.entity';
import { Repository } from 'typeorm';
import { UserClinic } from './entities/user-clinic.entity';
import { ClinicRole } from 'src/utils/enum/clinic-role.enum';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class ClinicService {
  constructor(
    @InjectRepository(Auth)
    private readonly authRepository: Repository<Auth>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserClinic)
    private readonly userClinicRepository: Repository<UserClinic>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async getClinicDetails(clinicId: string) {
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(['Clínica não encontrada']);
    }

    const participants = await this.userClinicRepository.find({
      where: {
        clinic: { id: clinicId },
      },
      relations: ['user', 'user.auths'],
    });

    return {
      id: clinic.id,
      name: clinic.name,

      participants: participants.map((p) => ({
        userId: p.user.id,
        name: p.user.name,
        email: p.user.auths[0].email,
        role: p.role,
        active: p.active,
      })),
    };
  }

  async createUserInClinic(
    clinicId: string,
    requesterId: string,
    data: {
      name: string;
      email: string;
      role: ClinicRole;
    },
  ) {
    const requester = await this.userClinicRepository.findOne({
      where: {
        user: { id: requesterId },
        clinic: { id: clinicId },
        active: true,
      },
    });

    if (requester && requester.role !== ClinicRole.ADMIN) {
      throw new ForbiddenException(['Apenas ADMIN pode criar usuários']);
    }

    const existingAuth = await this.authRepository.findOne({
      where: { email: data.email },
      relations: ['user'],
    });

    let user: User;

    if (existingAuth) {
      user = existingAuth.user;

      const alreadyInClinic = await this.userClinicRepository.findOne({
        where: {
          user: { id: user.id },
          clinic: { id: clinicId },
        },
      });

      if (alreadyInClinic) {
        throw new BadRequestException(['Usuário já pertence a esta clínica']);
      }
    } else {
      user = this.userRepository.create({
        name: data.name,
      });

      await this.userRepository.save(user);

      const auth = this.authRepository.create({
        email: data.email,
        user,
      });

      await this.authRepository.save(auth);
    }

    const userClinic = this.userClinicRepository.create({
      user,
      clinic: { id: clinicId },
      role: data.role,
    });

    await this.userClinicRepository.save(userClinic);

    return {
      message: 'Usuário criado e vinculado com sucesso',
    };
  }

  async searchProfessionals(clinicId: string, name?: string) {
    const queryBuilder = this.userClinicRepository
      .createQueryBuilder('userClinic')
      .innerJoinAndSelect('userClinic.user', 'user')
      .innerJoin('userClinic.clinic', 'clinic')
      .where('clinic.id = :clinicId', {
        clinicId,
      })
      .andWhere(
        `
        userClinic.role IN (:...roles)
        `,
        { roles: [ClinicRole.ADMIN, ClinicRole.PROFESSIONAL] },
      )
      .andWhere('userClinic.active = true')
      .take(10)
      .orderBy('user.name', 'ASC');

    if (name) {
      queryBuilder.andWhere(
        `
      user.name ILIKE :name
      `,
        {
          name: `%${name}%`,
        },
      );
    }

    const userClinics = await queryBuilder.getMany();

    return userClinics.map((userClinic) => ({
      id: userClinic.user.id,
      name: userClinic.user.name,
      role: userClinic.role,
    }));
  }

  async deactivateUser(
    requesterId: string,
    clinicId: string,
    targetUserId: string,
  ) {
    const requester = await this.userClinicRepository.findOne({
      where: {
        user: { id: requesterId },
        clinic: { id: clinicId },
        active: true,
      },
    });

    if (requester && requester.role !== ClinicRole.ADMIN) {
      throw new ForbiddenException(['Apenas ADMIN pode criar usuários']);
    }

    const userClinic = await this.userClinicRepository.findOne({
      where: {
        user: { id: targetUserId },
        clinic: { id: clinicId },
      },
    });

    if (!userClinic) {
      throw new NotFoundException(['Usuário não encontrado na clínica']);
    }

    userClinic.active = false;

    await this.userClinicRepository.save(userClinic);

    return { message: 'Usuário desativado com sucesso' };
  }

  async activateUser(
    requesterId: string,
    clinicId: string,
    targetUserId: string,
  ) {
    const requester = await this.userClinicRepository.findOne({
      where: {
        user: { id: requesterId },
        clinic: { id: clinicId },
        active: true,
      },
    });

    if (requester && requester.role !== ClinicRole.ADMIN) {
      throw new ForbiddenException(['Apenas ADMIN pode criar usuários']);
    }

    const userClinic = await this.userClinicRepository.findOne({
      where: {
        user: { id: targetUserId },
        clinic: { id: clinicId },
      },
      relations: ['user'],
    });

    if (!userClinic) {
      throw new NotFoundException(['Usuário não encontrado na clínica']);
    }

    userClinic.active = true;

    await this.userClinicRepository.save(userClinic);

    return {
      message: 'Usuário ativado com sucesso',
    };
  }
}
