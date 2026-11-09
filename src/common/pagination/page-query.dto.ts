import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MAX_PAGE_SIZE = 100;

/** Parámetros comunes de los endpoints paginados: ?page=1&limit=25&search=texto */
export class PageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  limit?: number = 25;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  sortDir?: string;
}

/** Convierte "A,B,C" (o ?x=A&x=B) en ['A','B','C'] y descarta valores fuera de [allowed]. */
export function parseList<T extends string>(value: unknown, allowed?: readonly T[]): T[] {
  const raw = Array.isArray(value) ? value.join(',') : typeof value === 'string' ? value : '';
  const items = raw.split(',').map((v) => v.trim()).filter(Boolean) as T[];
  return allowed ? items.filter((v) => allowed.includes(v)) : items;
}

/** Escapa % y _ para usar el texto del usuario dentro de LIKE. */
export function likeTerm(search?: string): string | null {
  const term = search?.trim();
  if (!term) return null;
  return `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

