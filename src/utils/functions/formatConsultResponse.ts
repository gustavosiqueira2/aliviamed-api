import { Consult } from 'src/modules/consult/entities/consult.entity';

export function formatConsultResponse(consult: Consult) {
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
      birthdate: consult.appointment.patient.birthdate,
    },
    professional: {
      id: consult.appointment.professional.id,
      name: consult.appointment.professional.name,
    },
  };
}
