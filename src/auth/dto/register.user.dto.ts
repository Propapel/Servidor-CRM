import { IsEmail, isNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterUserDto {

    name: string;

    lastname: string;

    email: string;

    puesto: string;


    phone: string;

    image: string;

    password: string;

    notificationToken?: string;

    refreshToken: string;
}