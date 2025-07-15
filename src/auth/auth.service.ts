import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { RegisterUserDto } from './dto/register.user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { MailService } from './service/MailService';
import { resetPasswordDto } from './dto/reset-password.dto';
import { Rol } from 'src/roles/rol.entity';
import { Sucursales } from 'src/sucursales/entities/sucursale.entity';
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
  ) {}

  async register(user: RegisterUserDto) {
    // 1️⃣ Verifica si el correo o teléfono ya existen
    const emailExist = await this.usersRepository.findOne({
      where: { email: user.email },
    });
    const isPhoneExist = await this.usersRepository.findOne({
      where: { phone: user.phone },
    });

    if (emailExist) {
      throw new HttpException(
        'El email ya está registrado',
        HttpStatus.CONFLICT,
      );
    }
    if (isPhoneExist) {
      throw new HttpException(
        'Ya hay un usuario con ese número de teléfono',
        HttpStatus.CONFLICT,
      );
    }

    // 2️⃣ Crea un nuevo usuario sin asignar relaciones aún
    const newUser = this.usersRepository.create({
      ...user,
      refreshToken: '',
    });

    // 3️⃣ Obtiene las sucursales del repositorio
    let sucursalIds =
      user.sucusalIds && user.sucusalIds.length > 0
        ? user.sucusalIds
        : ['Propapel Merida'];

    const sucursales = await this.sucusalesRepository.find({
      where: { id: In(sucursalIds) },
    });

    newUser.sucursales = sucursales; // Asigna las sucursales al usuario

    // 4️⃣ Obtiene los roles del repositorio
    let rolesIds =
      user.rolesIds && user.rolesIds.length > 0
        ? user.rolesIds
        : ['Ejecutivo de ventas'];

    const roles = await this.rolesRepository.find({
      where: { id: In(rolesIds) },
    });

    newUser.roles = roles; // Asigna los roles al usuario

    // 5️⃣ Guarda la imagen si está en base64
    if (user.image && user.image.trim() !== '') {
      const buffer = Buffer.from(user.image, 'base64');
      const pathImage = `profilePhoto_${Date.now()}`;
      const imageUrl = await storage(buffer, pathImage, 'image/png');

      if (imageUrl) {
        newUser.image = imageUrl; // Guarda la URL de la imagen
      }
    } else {
      newUser.image =
        'https://firebasestorage.googleapis.com/v0/b/prosales-c49e5.appspot.com/o/whatsapp-profiline-kendi-fotografini-koymayan-kisi_1132920.jpg?alt=media&token=2349da39-e2b7-4a0b-aebf-9313ad141aa1';
    }

    // 6️⃣ Guarda el usuario en la base de datos
    const userResponse = await this.usersRepository.save(newUser);

    // 7️⃣ Genera y actualiza los tokens
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

  async newLogin(loginRequest: LoginAuthDto) {
    const { email, password } = loginRequest;

    const userFound = await this.usersRepository.findOne({
      where: { email: email },
      relations: ['roles', 'roles.permissions', 'permissions', 'sucursales'],
    });

    if (!userFound) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    if (userFound.isDelete) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await compare(password, userFound.password);
    if (!isPasswordValid) {
      throw new HttpException(
        'La contraseña es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }

    const permissionsSet = new Set<string>();

    // ✅ Permisos por rol
    userFound.roles.forEach((rol) => {
      rol.permissions?.forEach((perm) => permissionsSet.add(perm.name));
    });

    // ✅ Permisos directos del usuario
    userFound.permissions?.forEach((perm) => permissionsSet.add(perm.name));

    const permissions = Array.from(permissionsSet);

    const payload = { id: userFound.id, name: userFound.name };
    const tokens = await this.getTokens(payload.id.toString(), payload.name);
    await this.updateRefreshToken(userFound.id.toString(), tokens.refreshToken);

    const accessTokenExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600;

    const data = {
      puesto: userFound.puesto,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      permissions: permissions,
      roles: userFound.roles,
      sucursales: userFound.sucursales,
      accessTokenExpirationTimestamp,
      userId: payload.id,
      lastname: userFound.lastname,
      name: userFound.name,
      email: userFound.email,
      image: userFound.image,
    };

    return data;
  }

  async login(loginRequest: LoginAuthDto) {
    const { email, password } = loginRequest;
    const userFound = await this.usersRepository.findOne({
      where: { email: email },
      relations: ['roles', 'sucursales'],
    });

    if (!userFound) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    if (userFound.isDelete) {
      throw new HttpException('El email no existe', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid = await compare(password, userFound.password);

    if (!isPasswordValid) {
      throw new HttpException(
        'La contraseña es incorrecta',
        HttpStatus.FORBIDDEN,
      );
    }

    const sucursalesIds = userFound.sucursales.map(
      (sucursal) => sucursal.nombre,
    );

    const rolesIds = userFound.roles.map((rol) => rol.id);

    const payload = { id: userFound.id, name: userFound.name };
    const token = this.jwtService.sign(payload);

    const tokens = await this.getTokens(payload.id.toString(), payload.name);
    await this.updateRefreshToken(userFound.id.toString(), tokens.refreshToken);

    const accessTokenExpirationTimestamp = Math.floor(Date.now() / 1000) + 3600;
    const data = {
      puesto: userFound.puesto,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      roles: rolesIds,
      sucursales: sucursalesIds,
      accessTokenExpirationTimestamp: accessTokenExpirationTimestamp,
      userId: payload.id,
      lastname: userFound.lastname,
      name: userFound.name,
      email: userFound.email,
      image: userFound.image,
    };
    return data;
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersRepository.findOneBy({ id: Number(userId) });
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
    return tokens;
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
          expiresIn: '2m',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          username,
        },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
