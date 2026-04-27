import { IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TechnicianKpiQueryDto {
  /** Año requerido. Ej: 2026 */
  @IsNumber()
  @Type(() => Number)
  year: number;

  /** Mes opcional (1-12). Si se omite, trae todo el año. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(12)
  @Type(() => Number)
  month?: number;

  /** Semana ISO opcional (1-53). Si se proporciona, filtra por semana dentro del año. */
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(53)
  @Type(() => Number)
  week?: number;
}
