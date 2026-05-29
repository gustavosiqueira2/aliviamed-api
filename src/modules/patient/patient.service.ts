import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Patient } from './entities/patient.entity';

import { CreatePatientDto } from './dto/create-patient.dto';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(UserClinic)
    private readonly userClinicRepository: Repository<UserClinic>,
  ) {}

  async create(data: CreatePatientDto, userId: string, clinicId: string) {
    const userClinic = await this.userClinicRepository.findOne({
      where: {
        user: { id: userId },
        clinic: { id: clinicId },
        active: true,
      },
      relations: ['clinic'],
    });

    if (!userClinic) {
      throw new ForbiddenException(['Você não tem acesso a esta clínica']);
    }

    const patient = this.patientRepository.create({
      name: data.name,
      birthdate: new Date(data.birthdate),
      clinic: userClinic.clinic,
    });

    return this.patientRepository.save(patient);
  }

  async findAll(
    clinicId: string,
    query: { page?: number; limit?: number; name?: string },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    if (page < 1) {
      throw new BadRequestException(['page deve ser maior ou igual a 1']);
    }

    if (limit > 25) {
      throw new BadRequestException(['limit máximo permitido é 25']);
    }

    const skip = (page - 1) * limit;

    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.clinicId = :clinicId', { clinicId });

    if (query.name) {
      qb.andWhere('patient.name ILIKE :name', {
        name: `%${query.name}%`,
      });
    }

    const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async search(clinicId: string, name?: string) {
    const queryBuilder = this.patientRepository
      .createQueryBuilder('patient')
      .leftJoin('patient.clinic', 'clinic')
      .where('clinic.id = :clinicId', {
        clinicId,
      })
      .take(10)
      .orderBy('patient.name', 'ASC');

    if (name) {
      queryBuilder.andWhere(
        `
      LOWER(patient.name)
      LIKE
      LOWER(:name)
      `,
        {
          name: `%${name}%`,
        },
      );
    }

    const patients = await queryBuilder.getMany();

    return patients.map((patient) => ({
      id: patient.id,
      name: patient.name,
    }));
  }

  async findOne(patientId: string, clinicId: string) {
    const patient = await this.patientRepository.findOne({
      where: {
        id: patientId,
        clinic: { id: clinicId },
      },
    });

    if (!patient) {
      throw new NotFoundException(['Paciente não encontrado']);
    }

    return patient;
  }

  async update(patientId: string, clinicId: string, data: UpdatePatientDto) {
    const patient = await this.patientRepository.findOne({
      where: {
        id: patientId,
        clinic: { id: clinicId },
      },
    });

    if (!patient) {
      throw new NotFoundException(['Paciente não encontrado']);
    }

    if (!data.name && !data.birthdate) {
      throw new BadRequestException([
        'Informe ao menos um campo para atualizar',
      ]);
    }

    if (data.name !== undefined) {
      patient.name = data.name;
    }

    if (data.birthdate !== undefined) {
      patient.birthdate = new Date(data.birthdate);
    }

    return this.patientRepository.save(patient);
  }
}
