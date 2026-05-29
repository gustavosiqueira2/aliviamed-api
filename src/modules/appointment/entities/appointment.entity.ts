import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';
import { Clinic } from 'src/modules/clinic/entities/clinic.entity';
import { Patient } from 'src/modules/patient/entities/patient.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { AppointmentStatus } from 'src/utils/enum/appointment-status.enum';
import { Consult } from 'src/modules/consult/entities/consult.entity';

@Entity()
export class Appointment extends BaseEntity {
  @Column({
    name: 'starts_at',
  })
  startsAt!: Date;

  @Column({
    name: 'ends_at',
  })
  endsAt!: Date;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED,
  })
  status!: AppointmentStatus;

  @Column({
    name: 'checked_at',
    type: 'timestamp',
    nullable: true,
  })
  checkedAt?: Date;

  @Column({
    name: 'canceled_at',
    type: 'timestamp',
    nullable: true,
  })
  canceledAt?: Date;

  @Column({
    nullable: true,
  })
  canceledByUserId?: string;

  @ManyToOne(() => Clinic)
  @JoinColumn()
  clinic!: Clinic;

  @ManyToOne(() => Patient)
  @JoinColumn()
  patient!: Patient;

  @ManyToOne(() => User)
  @JoinColumn()
  professional!: User;

  @OneToOne(() => Consult)
  @JoinColumn()
  consult!: Consult;
}
