import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Appointment } from '../appointment/entities/appointment.entity';
import { IsNull, Repository } from 'typeorm';
import { AppointmentStatus } from 'src/utils/enum/appointment-status.enum';
import { Consult } from './entities/consult.entity';
import { UpdateConsultDto } from './dto/update-consult.dto';

@Injectable()
export class ConsultService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Consult)
    private readonly consultRepository: Repository<Consult>,
  ) {}

  async start(appointmentId: string, clinicId: string) {
    const appointment = await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
        clinic: { id: clinicId },
      },
      relations: ['consult', 'professional'],
    });

    if (!appointment) {
      throw new NotFoundException(['Agendamento não encontrado']);
    }
    const openedConsult = await this.consultRepository.findOne({
      where: {
        finishedAt: IsNull(),
        appointment: { professional: { id: appointment.professional.id } },
      },
    });
    if (openedConsult) {
      throw new BadRequestException([
        'O profissional já possui uma consulta em andamento',
      ]);
    }
    if (appointment.status !== AppointmentStatus.WAITING_CONSULTATION) {
      throw new BadRequestException(['Paciente não está aguardando consulta']);
    }
    if (appointment.consult) {
      throw new BadRequestException(['Consulta já iniciada']);
    }

    const consult = this.consultRepository.create({
      startedAt: new Date(),
      appointment,
    });
    await this.consultRepository.save(consult);

    appointment.status = AppointmentStatus.IN_CONSULTATION;
    appointment.consult = consult;
    await this.appointmentRepository.save(appointment);

    return consult;
  }

  async findByAppointment(appointmentId: string, clinicId: string) {
    const consult = await this.consultRepository.findOne({
      where: {
        appointment: {
          id: appointmentId,
          clinic: { id: clinicId },
        },
      },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.professional',
      ],
    });

    if (!consult) {
      throw new NotFoundException(['Consulta não encontrada']);
    }

    return this.formatConsultResponse(consult);
  }

  async findMyActiveConsult(userId: string, clinicId: string) {
    const consult = await this.consultRepository.findOne({
      where: {
        finishedAt: IsNull(),
        appointment: {
          clinic: {
            id: clinicId,
          },
          professional: {
            id: userId,
          },
          status: AppointmentStatus.IN_CONSULTATION,
        },
      },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.professional',
      ],
    });

    if (!consult) {
      return null;
    }

    return this.formatConsultResponse(consult);
  }

  async update(id: string, clinicId: string, data: UpdateConsultDto) {
    if (Object.values(data).filter((d) => !!d).length === 0) {
      throw new BadRequestException(['Nenhum dado enviado']);
    }

    const consult = await this.consultRepository.findOne({
      where: { id, appointment: { clinic: { id: clinicId } } },
      relations: [
        'appointment',
        'appointment.patient',
        'appointment.professional',
      ],
    });

    if (!consult) {
      throw new NotFoundException(['Consulta não encontrada']);
    }
    if (consult.finishedAt) {
      throw new BadRequestException(['Consulta finalizada']);
    }

    Object.assign(consult, data);

    await this.consultRepository.save(consult);

    return this.formatConsultResponse(consult);
  }

  async finish(consultId: string, clinicId: string) {
    const consult = await this.consultRepository.findOne({
      where: {
        id: consultId,
        finishedAt: IsNull(),
        appointment: {
          clinic: { id: clinicId },
          status: AppointmentStatus.IN_CONSULTATION,
        },
      },
      relations: ['appointment', 'appointment.clinic'],
    });

    if (!consult) {
      throw new NotFoundException(['Consulta ativa não encontrada']);
    }

    consult.finishedAt = new Date();
    consult.appointment.status = AppointmentStatus.COMPLETED;

    await this.consultRepository.save(consult);
    await this.appointmentRepository.save(consult.appointment);

    return { message: 'Consulta finalizada com sucesso' };
  }

  private formatConsultResponse(consult: Consult) {
    return {
      id: consult.id,
      createdAt: consult.createdAt,
      updatedAt: consult.updatedAt,
      startedAt: consult.startedAt,
      finishedAt: consult.finishedAt,
      complaint: consult.complaint,
      evolution: consult.evolution,
      diagnosis: consult.diagnosis,
      prescription: consult.prescription,
      notes: consult.notes,
      appointment: {
        id: consult.appointment.id,
        status: consult.appointment.status,
        startsAt: consult.appointment.startsAt,
        endsAt: consult.appointment.endsAt,
      },
      patient: {
        id: consult.appointment.patient.id,
        name: consult.appointment.patient.name,
      },
      professional: {
        id: consult.appointment.professional.id,
        name: consult.appointment.professional.name,
      },
    };
  }
}
