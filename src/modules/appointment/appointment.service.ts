import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Patient } from '../patient/entities/patient.entity';
import { User } from '../user/entities/user.entity';
import { AppointmentStatus } from 'src/utils/enum/appointment-status.enum';
import { RescheduleAppointmentDto } from './entities/reschedule-appointment.dto';
import { FindAppointmentsDto } from './dto/find-appointments.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(data: CreateAppointmentDto, clinicId: string) {
    const professional = await this.userRepository.findOne({
      where: {
        id: data.professionalId,
      },
    });

    if (!professional) {
      throw new NotFoundException(['Profissional não encontrado']);
    }

    const patient = await this.patientRepository.findOne({
      where: {
        id: data.patientId,
        clinic: { id: clinicId },
      },
    });

    if (!patient) {
      throw new NotFoundException(['Paciente não encontrado']);
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    this.validateAppointmentDates(startsAt, endsAt);

    await this.validateProfessionalAvailability(
      professional.id,
      new Date(data.startsAt),
      new Date(data.endsAt),
      clinicId,
    );

    const appointment = this.appointmentRepository.create({
      clinic: {
        id: clinicId,
      },
      patient,
      professional,
      startsAt: new Date(data.startsAt),
      endsAt: new Date(data.endsAt),
    });

    return this.appointmentRepository.save(appointment);
  }

  async findAll(clinicId: string, query: FindAppointmentsDto) {
    const { page = 1, limit = 10, date, status, professionalId } = query;

    const queryBuilder = this.appointmentRepository
      .createQueryBuilder('appointment')
      .leftJoin('appointment.clinic', 'clinic')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.professional', 'professional')
      .where('clinic.id = :clinicId', { clinicId });

    if (status) {
      queryBuilder.andWhere('appointment.status = :status', {
        status,
      });
    }
    if (date) {
      queryBuilder.andWhere(
        `
        DATE(appointment.startsAt) = :date
        `,
        { date },
      );
    }
    if (professionalId) {
      queryBuilder.andWhere('professional.id = :professionalId', {
        professionalId,
      });
    }

    queryBuilder
      .orderBy('appointment.startsAt', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [appointments, total] = await queryBuilder.getManyAndCount();

    return {
      data: appointments.map(this.mapAppointment),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        clinic: {
          id: clinicId,
        },
      },
      relations: ['patient', 'professional', 'consult'],
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }

    return this.mapAppointment(appointment);
  }

  async reschedule(
    appointmentId: string,
    clinicId: string,
    data: RescheduleAppointmentDto,
  ) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        clinic: { id: clinicId },
      },
      relations: ['patient', 'professional', 'clinic'],
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException([
        'Não é possível reagendar um agendamento concluído',
      ]);
    }

    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    this.validateAppointmentDates(startsAt, endsAt);

    await this.validateProfessionalAvailability(
      appointment.professional.id,
      new Date(data.startsAt),
      new Date(data.endsAt),
      clinicId,
      appointment.id,
    );

    if (
      [AppointmentStatus.CANCELED, AppointmentStatus.NO_SHOW].includes(
        appointment.status,
      )
    ) {
      const newAppointment = this.appointmentRepository.create({
        clinic: appointment.clinic,
        patient: appointment.patient,
        professional: appointment.professional,
        startsAt: new Date(data.startsAt),
        endsAt: new Date(data.endsAt),
        status: AppointmentStatus.SCHEDULED,
      });

      return this.mapAppointment(
        await this.appointmentRepository.save(newAppointment),
      );
    }

    appointment.startsAt = new Date(data.startsAt);
    appointment.endsAt = new Date(data.endsAt);
    appointment.status = AppointmentStatus.SCHEDULED;

    return this.mapAppointment(
      await this.appointmentRepository.save(appointment),
    );
  }

  async confirm(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,

        clinic: {
          id: clinicId,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(['Agendamento cancelado']);
    }

    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(['Agendamento marcado como falta']);
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(['Agendamento já concluído']);
    }

    if (appointment.status === AppointmentStatus.CONFIRMED) {
      throw new BadRequestException(['Agendamento já confirmado']);
    }

    appointment.status = AppointmentStatus.CONFIRMED;

    await this.appointmentRepository.save(appointment);

    return { message: 'Agendamento alterado!' };
  }

  async waitingConsultation(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        clinic: {
          id: clinicId,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }
    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(['Agendamento cancelado']);
    }
    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(['Agendamento marcado como falta']);
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(['Agendamento já concluído']);
    }
    if (appointment.status === AppointmentStatus.IN_CONSULTATION) {
      throw new BadRequestException(['Atendimento já iniciado']);
    }
    if (appointment.status === AppointmentStatus.WAITING_CONSULTATION) {
      throw new BadRequestException(['Paciente já está aguardando']);
    }

    appointment.status = AppointmentStatus.WAITING_CONSULTATION;
    appointment.checkedAt = new Date();

    await this.appointmentRepository.save(appointment);

    return { message: 'Paciente aguardando atendimento' };
  }

  async complete(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        clinic: {
          id: clinicId,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(['Agendamento cancelado']);
    }

    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(['Agendamento marcado como falta']);
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(['Agendamento já concluído']);
    }

    appointment.status = AppointmentStatus.COMPLETED;

    return this.appointmentRepository.save(appointment);
  }

  async noShow(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,

        clinic: {
          id: clinicId,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }
    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(['Agendamento cancelado']);
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(['Agendamento já concluído']);
    }
    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(['Agendamento já marcado como falta']);
    }
    if (appointment.endsAt > new Date()) {
      throw new BadRequestException(['O agendamento ainda não terminou']);
    }

    appointment.status = AppointmentStatus.NO_SHOW;

    await this.appointmentRepository.save(appointment);

    return {
      message: 'Agendamento alterado!',
    };
  }

  async cancel(appointmentId: string, userId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,

        clinic: {
          id: clinicId,
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }

    if (appointment.status === AppointmentStatus.NO_SHOW) {
      throw new BadRequestException(['Agendamento dado como não compareceu']);
    }

    if (appointment.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(['Agendamento já cancelado']);
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(['Agendamento já concluído']);
    }

    appointment.status = AppointmentStatus.CANCELED;
    appointment.canceledAt = new Date();
    appointment.canceledByUserId = userId;

    await this.appointmentRepository.save(appointment);

    return { message: 'Agendamento canelado!' };
  }

  private async validateProfessionalAvailability(
    professionalId: string,
    startsAt: Date,
    endsAt: Date,
    clinicId: string,
    ignoreAppointmentId?: string,
  ) {
    const query = this.appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.professionalId = :professionalId', {
        professionalId,
      })
      .andWhere('appointment.clinicId = :clinicId', {
        clinicId,
      })
      .andWhere('appointment.status != :canceled', {
        canceled: AppointmentStatus.CANCELED,
      })
      .andWhere(
        `
        :startsAt < appointment.ends_at
        AND
        :endsAt > appointment.starts_at
        `,
        {
          startsAt,
          endsAt,
        },
      );

    if (ignoreAppointmentId) {
      query.andWhere('appointment.id != :ignoreAppointmentId', {
        ignoreAppointmentId,
      });
    }

    const conflict = await query.getOne();

    if (conflict) {
      throw new BadRequestException([
        'Profissional já possui um agendamento neste horário',
      ]);
    }
  }

  private validateAppointmentDates(startsAt: Date, endsAt: Date) {
    const now = new Date();

    if (startsAt < now) {
      throw new BadRequestException([
        'A data do agendamento precisa ser futura',
      ]);
    }

    if (endsAt <= startsAt) {
      throw new BadRequestException([
        'A data final deve ser maior que a inicial',
      ]);
    }

    const durationInMinutes =
      (endsAt.getTime() - startsAt.getTime()) / 1000 / 60;

    if (durationInMinutes > 720) {
      throw new BadRequestException(['Agendamento muito longo']);
    }
  }

  private mapAppointment = (appointment: Appointment) => ({
    ...appointment,
    patient: {
      id: appointment.patient.id,
      name: appointment.patient.name,
    },
    professional: {
      id: appointment.professional.id,
      name: appointment.professional.name,
    },
  });
}
