import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { In, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register.user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { MailService } from './service/MailService';
import { resetPasswordDto } from './dto/reset-password.dto';
import { Rol } from '../roles/rol.entity';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import storage = require('../utils/cloud_storage.js');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
    @InjectRepository(Sucursales)
    private sucusalesRepository: Repository<Sucursales>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async register(user: RegisterUserDto) {
    await this.checkUserExistence(user.email, user.phone);

    const newUser = this.usersRepository.create({
      ...user,
      refreshToken: '',
    });

    newUser.sucursales = await this.resolveSucursales(['2']);
    newUser.roles = await this.resolveRoles(['5']);
    newUser.image = await this.resolveUserImage(user.image);

    const userResponse = await this.usersRepository.save(newUser);

    const tokens = await this.getTokens(
      userResponse.id.toString(),
      userResponse.name,
    );
    await this.updateRefreshToken(
      userResponse.id.toString(),
      tokens.refreshToken,
    );

    return userResponse;
  }

  async registerClient(user: RegisterUserDto) {
    await this.checkUserExistence(user.email, user.phone);

    const newUser = this.usersRepository.create({
      ...user,
      refreshToken: '',
    });

    newUser.sucursales = await this.resolveSucursales(['2']);
    newUser.roles = await this.resolveRoles(['7']); // Asignamos el rol con ID '7' (Cliente)
    newUser.image = await this.resolveUserImage(user.image);

    const userResponse = await this.usersRepository.save(newUser);

    const tokens = await this.getTokens(
      userResponse.id.toString(),
      userResponse.name,
    );
    await this.updateRefreshToken(
      userResponse.id.toString(),
      tokens.refreshToken,
    );

    return userResponse;
  }

  async login(loginRequest: LoginAuthDto) {
    const userFound = await this.validateUser(loginRequest);
    const permissions = this.getPermissions(userFound);

    const payload = { id: userFound.id, name: userFound.name };
    const tokens = await this.getTokens(payload.id.toString(), payload.name);
    await this.updateRefreshToken(userFound.id.toString(), tokens.refreshToken);

    const accessTokenExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600;

    return {
      puesto: userFound.puesto,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      permissions: permissions,
      clients: userFound.assignedClients,
      roles: userFound.roles,
      sucursales: userFound.sucursales[0],
      accessTokenExpirationTimestamp,
      userId: userFound.id,
      lastname: userFound.lastname,
      name: userFound.name,
      email: userFound.email,
      image: userFound.image,
    };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id: Number(userId) },
      relations: ['roles', 'roles.permissions', 'permissions', 'sucursales', 'clients', 'assignedClients'],
    });
    if (!user || !user.refreshToken)
      return new HttpException('Acceso denegado', HttpStatus.FORBIDDEN);
    const refreshTokenMatches = await argon2.verify(
      user.refreshToken,
      refreshToken,
    );
    if (!refreshTokenMatches)
      return new HttpException('Acceso denegado', HttpStatus.FORBIDDEN);
    const tokens = await this.getTokens(user.id.toString(), user.name);
    await this.updateRefreshToken(user.id.toString(), tokens.refreshToken);

    // Devolver la misma estructura que en el login para que el front no falle al parsear
    const permissions = this.getPermissions(user);
    const accessTokenExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600;

    return {
      puesto: user.puesto,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      permissions,
      clients: user.assignedClients,
      roles: user.roles,
      sucursales: user.sucursales ? user.sucursales[0] : null,
      accessTokenExpirationTimestamp,
      userId: user.id,
      lastname: user.lastname,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await this.hashData(refreshToken);
    await this.usersRepository.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  hashData(data: string) {
    return argon2.hash(data);
  }

  async getTokens(userId: string, username: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: '30d',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '60d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async validateUser(loginAuthDto: LoginAuthDto): Promise<User> {
    const { email, password } = loginAuthDto;
    const user = await this.usersRepository.findOne({
      where: { email },
      relations: ['roles', 'roles.permissions', 'permissions', 'sucursales', 'clients', 'assignedClients'],
    });

    if (!user || user.isDelete) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'La contraseña es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }

    return user;
  }

  private getPermissions(user: User): string[] {
    const permissionsSet = new Set<string>();

    user.roles?.forEach((rol) => {
      rol.permissions?.forEach((perm) => permissionsSet.add(perm.name));
    });

    user.permissions?.forEach((perm) => permissionsSet.add(perm.name));

    return Array.from(permissionsSet);
  }

  private async checkUserExistence(email: string, phone: string) {
    const emailExist = await this.usersRepository.findOne({
      where: { email },
    });
    if (emailExist) {
      throw new HttpException('El email ya está registrado', HttpStatus.CONFLICT);
    }
    const isPhoneExist = await this.usersRepository.findOne({
      where: { phone },
    });
    if (isPhoneExist) {
      throw new HttpException(
        'Ya hay un usuario con ese número de teléfono',
        HttpStatus.CONFLICT,
      );
    }
  }

  private async resolveSucursales(sucursalIds?: string[]) {
    const ids =
      sucursalIds && sucursalIds.length > 0 ? sucursalIds : ['Propapel Merida'];

    return this.sucusalesRepository.find({
      where: { id: In(ids) },
    });
  }

  private async resolveRoles(rolesIds?: string[]) {
    const ids =
      rolesIds && rolesIds.length > 0 ? rolesIds : ['Ejecutivo de ventas'];

    return this.rolesRepository.find({
      where: { id: In(ids) },
    });
  }

  private async resolveUserImage(image?: string) {
    if (image && image.trim() !== '') {
      const buffer = Buffer.from(image, 'base64');
      const pathImage = `profilePhoto_${Date.now()}`;
      return await storage.uploadFromBuffer(buffer, pathImage, 'image/png');
    }
    return 'https://firebasestorage.googleapis.com/v0/b/prosales-c49e5.appspot.com/o/whatsapp-profiline-kendi-fotografini-koymayan-kisi_1132920.jpg?alt=media&token=2349da39-e2b7-4a0b-aebf-9313ad141aa1';
  }
}
