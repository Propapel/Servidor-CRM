import 'reflect-metadata';
import { likeTerm, parseList } from './page-query.dto';
import { normalizePage, orderByIds, toPagedResponse } from './paged-response';

describe('paginación', () => {
  it('normaliza page/limit y calcula el offset', () => {
    expect(normalizePage(3, 20)).toEqual({ page: 3, limit: 20, offset: 40 });
    expect(normalizePage(undefined, undefined)).toEqual({ page: 1, limit: 25, offset: 0 });
    expect(normalizePage(0, 5000)).toEqual({ page: 1, limit: 100, offset: 0 }); // tope de 100 por página
  });

  it('arma info con total, páginas y enlaces', () => {
    const req: any = { protocol: 'https', get: () => 'api', originalUrl: '/ticket/page?branchId=2&page=2' };
    const res = toPagedResponse([1, 2], 51, 2, 25, req);
    expect(res.info).toMatchObject({ count: 51, pages: 3, page: 2, limit: 25 });
    expect(res.info.next).toBe('https://api/ticket/page?branchId=2&page=3&limit=25');
    expect(res.info.prev).toBe('https://api/ticket/page?branchId=2&page=1&limit=25');
    expect(toPagedResponse([], 0, 1, 25).info).toMatchObject({ pages: 1, next: null, prev: null });
  });

  it('filtra valores no permitidos de las listas', () => {
    expect(parseList('A, B,,X', ['A', 'B'] as const)).toEqual(['A', 'B']);
    expect(parseList(['A', 'B'])).toEqual(['A', 'B']);
    expect(parseList(undefined)).toEqual([]);
  });

  it('escapa comodines de LIKE', () => {
    expect(likeTerm('  50%_off ')).toBe('%50\\%\\_off%');
    expect(likeTerm('   ')).toBeNull();
  });

  it('respeta el orden de los ids de la página', () => {
    expect(orderByIds([{ id: 1 }, { id: 3 }, { id: 2 }], [3, 1, 2, 9], (x) => x.id)).toEqual([{ id: 3 }, { id: 1 }, { id: 2 }]);
  });
});
