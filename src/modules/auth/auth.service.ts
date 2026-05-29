import * as bcrypt from 'bcrypt';

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { JwtService } from '@nestjs/jwt';
import { Auth } from './entities/auth.entity';
import { UserClinic } from 'src/modules/clinic/entities/user-clinic.entity';
import { Clinic } from 'src/modules/clinic/entities/clinic.entity';
import { JwtUser } from './strategies/jwt-user.interface';
import { User } from 'src/modules/user/entities/user.entity';
import { ClinicRole } from 'src/utils/enum/clinic-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private dataSource: DataSource,
    @InjectRepository(Auth)
    private authRepository: Repository<Auth>,
    @InjectRepository(UserClinic)
    private userClinicRepository: Repository<UserClinic>,
    private jwtService: JwtService,
  ) {}

  async register(data: { name: string; email: string; password: string }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await this.dataSource.transaction<User>(async (manager) => {
      const userRepository = manager.getRepository(User);
      const clinicRepository = manager.getRepository(Clinic);
      const userClinicRepository = manager.getRepository(UserClinic);
      const authRepository = manager.getRepository(Auth);

      const user = userRepository.create({
        name: data.name,
      });

      await userRepository.save(user);

      const clinic = clinicRepository.create({
        name: `${data.name}'s Clinic`,
      });

      await clinicRepository.save(clinic);

      const userClinic = userClinicRepository.create({
        user,
        clinic,
        role: ClinicRole.ADMIN,
      });

      await userClinicRepository.save(userClinic);

      const auth = authRepository.create({
        email: data.email,
        password: hashedPassword,
        user,
      });

      await authRepository.save(auth);

      return user;
    });
  }

  async login(data: { email: string; password: string }) {
    const auth = await this.authRepository.findOne({
      where: { email: data.email },
      relations: ['user'],
    });

    if (!auth) {
      throw new UnauthorizedException(['Credenciais inválidas']);
    }

    if (!auth.password) {
      throw new UnauthorizedException(['Credenciais inválidas - [INCOMPLETE]']);
    }

    const isPasswordValid = await bcrypt.compare(data.password, auth.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(['Credenciais inválidas']);
    }

    const userClinics = await this.userClinicRepository.find({
      where: { user: { id: auth.user.id } },
      relations: ['clinic'],
    });

    if (!userClinics.length) {
      throw new UnauthorizedException(['Usuário sem clínica']);
    }

    const payload: JwtUser = {
      id: auth.user.id,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: auth.user,
      userClinics: userClinics,
    };
  }

  async me(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userClinics', 'userClinics.clinic'],
    });

    return user;
  }
}
