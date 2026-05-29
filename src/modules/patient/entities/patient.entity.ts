import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';
import { Clinic } from 'src/modules/clinic/entities/clinic.entity';
import { Appointment } from 'src/modules/appointment/entities/appointment.entity';

@Entity()
export class Patient extends BaseEntity {
  @Column()
  name!: string;

  @Column({ type: 'date' })
  birthdate!: Date;

  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Column({ type: 'varchar', nullable: true })
  document?: string;

  @Column({ type: 'varchar', nullable: true })
  sex?: string;

  @Column({ type: 'varchar', nullable: true })
  email?: string;

  @ManyToOne(() => Clinic, (clinic) => clinic.patients, {
    nullable: false,
  })
  @JoinColumn()
  clinic!: Clinic;

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  @JoinColumn()
  appointments!: Appointment[];
}
