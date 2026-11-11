import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { PushPlatform } from '../entities/push-device.entity';

export class RegisterDeviceDto {
  @IsString() @IsNotEmpty() @MaxLength(512)
  token: string;

  @IsIn(Object.values(PushPlatform))
  platform: PushPlatform;

  @IsOptional() @IsString() @MaxLength(120)
  deviceName?: string;

  @IsOptional() @IsString() @MaxLength(40)
  appVersion?: string;
}

export class UnregisterDeviceDto {
  @IsString() @IsNotEmpty() @MaxLength(512)
  token: string;
}
