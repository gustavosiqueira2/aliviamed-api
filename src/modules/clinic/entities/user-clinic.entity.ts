import { Entity, ManyToOne, Column, Unique, JoinColumn } from 'typeorm';

import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';
import { Clinic } from 'src/modules/clinic/entities/clinic.entity';
import { ClinicRole } from 'src/utils/enum/clinic-role.enum';

@Entity()
@Unique(['user', 'clinic'])
export class UserClinic extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ClinicRole,
  })
  role!: ClinicRole;

  @Column({ default: true })
  active!: boolean;

  @ManyToOne(() => User, (user) => user.userClinics, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user!: User;

  @ManyToOne(() => Clinic, (clinic) => clinic.userClinics, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  clinic!: Clinic;
}
