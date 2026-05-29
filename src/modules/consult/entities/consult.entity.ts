import { Appointment } from 'src/modules/appointment/entities/appointment.entity';

import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Consult {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({
    nullable: true,
    type: 'text',
  })
  complaint?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  evolution?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  diagnosis?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  prescription?: string;

  @Column({
    nullable: true,
    type: 'text',
  })
  notes?: string;

  @Column()
  startedAt!: Date;

  @Column({
    nullable: true,
  })
  finishedAt?: Date;

  @OneToOne(() => Appointment)
  @JoinColumn()
  appointment!: Appointment;
}
