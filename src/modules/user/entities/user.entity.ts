import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { Auth } from 'src/modules/auth/entities/auth.entity';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';
import { Appointment } from 'src/modules/appointment/entities/appointment.entity';

@Entity()
export class User extends BaseEntity {
  @Column()
  name!: string;

  @OneToMany(() => Auth, (auth) => auth.user)
  auths!: Auth[];

  @OneToMany(() => UserClinic, (uc) => uc.user)
  userClinics!: UserClinic[];

  @OneToMany(() => Appointment, (appointment) => appointment.clinic)
  appointments!: Appointment[];
}
