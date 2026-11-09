import { Request } from 'express';
import { MAX_PAGE_SIZE } from './page-query.dto';

/**
 * Misma forma que ya usa la app para /ticket/byBranchPaging ({ info, results }),
 * con page y limit añadidos para que el cliente no tenga que deducirlos.
 */
export interface PagedResponse<T> {
  info: {
    count: number;
    pages: number;
    page: number;
    limit: number;
    next: string | null;
    prev: string | null;
  };
  results: T[];
}

export function normalizePage(page?: number, limit?: number) {
  const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), MAX_PAGE_SIZE);
  const safePage = Math.max(Number(page) || 1, 1);
  return { page: safePage, limit: safeLimit, offset: (safePage - 1) * safeLimit };
}

export function toPagedResponse<T>(
  results: T[],
  total: number,
  page: number,
  limit: number,
  request?: Request,
): PagedResponse<T> {
  const pages = Math.max(Math.ceil(total / limit), 1);
  const link = (target: number) => {
    if (!request) return null;
    const url = new URL(request.originalUrl ?? request.url, `${request.protocol}://${request.get('host')}`);
    url.searchParams.set('page', String(target));
    url.searchParams.set('limit', String(limit));
    return url.toString();
  };
  return {
    info: {
      count: total,
      pages,
      page,
      limit,
      next: page < pages ? link(page + 1) : null,
      prev: page > 1 ? link(page - 1) : null,
    },
    results,
  };
}

/** Reordena las entidades cargadas con IN (...) según el orden de los ids de la página. */
export function orderByIds<T>(items: T[], ids: number[], getId: (item: T) => number): T[] {
  const byId = new Map(items.map((i) => [getId(i), i]));
  return ids.map((id) => byId.get(id)).filter((i): i is T => i !== undefined);
}

/** Columnas de usuario seguras para listas (nunca password, refreshToken ni fcmToken). */
export const SAFE_USER_COLUMNS = ['id', 'name', 'lastname', 'email', 'image', 'phone', 'puesto', 'wallet'] as const;
export function safeUserSelect(alias: string): string[] {
  return SAFE_USER_COLUMNS.map((c) => `${alias}.${c}`);
}
