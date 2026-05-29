import { Entity, Column, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Patient } from 'src/modules/patient/entities/patient.entity';
import { UserClinic } from './user-clinic.entity';
import { Appointment } from 'src/modules/appointment/entities/appointment.entity';

@Entity()
export class Clinic extends BaseEntity {
  @Column()
  name!: string;

  @OneToMany(() => UserClinic, (uc) => uc.clinic)
  @JoinColumn()
  userClinics!: UserClinic[];

  @OneToMany(() => Patient, (patient) => patient.clinic)
  @JoinColumn()
  patients!: Patient[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  @JoinColumn()
  appointments!: Appointment[];
}
