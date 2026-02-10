import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { resetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './service/MailService';
import { alertReminderDto } from './dto/alert_reminder.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private mailService: MailService,
  ) {}

  /**
   * Registra un nuevo usuario en el sistema.
   * @param user Datos del usuario a registrar.
   * @returns El usuario registrado y sus tokens de acceso.
   */
  @Post('register')
  register(@Body() user: RegisterUserDto) {
    return this.authService.register(user);
  }

  /**
   * Inicia sesión en el sistema.
   * @param user Credenciales del usuario (email y contraseña).
   * @returns Datos del usuario y tokens de acceso.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() user: LoginAuthDto) {
    return this.authService.login(user);
  }

  /**
   * Envía un correo electrónico para restablecer la contraseña.
   * @param resetPassword DTO con el email del usuario.
   */
  @Post('resetPassword')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPassword: resetPasswordDto) {
    await this.mailService.sendPasswordResetEmail(
      resetPassword.email,
      resetPassword.email,
    );
  }

  /**
   * Envía un correo electrónico de alerta.
   * @param alertReminderDto Datos de la alerta.
   */
  @Post('alert')
  @HttpCode(HttpStatus.OK)
  async alertMessage(@Body() alertReminderDto: alertReminderDto) {
    await this.mailService.sendAlertEmail(alertReminderDto);
  }

  /**
   * Refresca los tokens de acceso utilizando un token de refresco válido.
   * @param body DTO con userId y refreshToken.
   * @returns Nuevos tokens de acceso y refresco.
   */
  @Post('refreshToken')
  @HttpCode(HttpStatus.OK)
  refreshTokenWithBody(@Body() body: RefreshTokenDto) {
    const { userId, refreshToken } = body;
    return this.authService.refreshTokens(userId, refreshToken);
  }
}
