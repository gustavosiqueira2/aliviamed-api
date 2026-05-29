import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity()
export class Auth extends BaseEntity {
  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password?: string;

  @ManyToOne(() => User, (user) => user.auths, {
    onDelete: 'CASCADE',
  })
  user!: User;
}
