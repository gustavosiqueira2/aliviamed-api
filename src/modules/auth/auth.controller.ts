import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';

import { CurrentUser } from 'src/utils/decorators/current-user.decorator';

import { JwtAuthGuard } from './strategies/jwt-auth.guard';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(
    @Body()
    body: RegisterDto,
  ) {
    return this.authService.register(body);
  }

  @Post('login')
  login(
    @Body()
    body: LoginDto,
  ) {
    return this.authService.login(body);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser('id') id: string) {
    return this.authService.me(id);
  }
}
