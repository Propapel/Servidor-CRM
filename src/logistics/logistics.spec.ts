import 'reflect-metadata';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDecommissionDto, CreatePrinterDto, CreateShipmentDto } from './dto/logistics.dto';
import { detectFileType, LogisticsService } from './logistics.service';

const errorsOf = async (cls: any, body: object) => (await validate(plainToInstance(cls, body) as object)).map((e) => e.property);

function make(opts: { printer?: any; pendingBaja?: any; baja?: any } = {}) {
  const printers: any = {
    findOneBy: jest.fn().mockResolvedValue(opts.printer ?? null),
    create: (x: any) => x, save: jest.fn(async (x: any) => ({ id: 1, ...x })),
  };
  const decommissions: any = {
    findOneBy: jest.fn(async (w: any) => (w.status === 'PENDIENTE' ? opts.pendingBaja ?? null : opts.baja ?? null)),
    create: (x: any) => x, save: jest.fn(async (x: any) => ({ id: 5, ...x })),
  };
  const users: any = { findOne: jest.fn().mockResolvedValue({ id: 9, name: 'Ana', lastname: 'Ruiz' }) };
  const txPrinters: any = { findOneBy: jest.fn().mockResolvedValue(opts.printer ?? null), save: jest.fn(async (x: any) => x) };
  const txBajas: any = { save: jest.fn(async (x: any) => x) };
  const dataSource: any = { transaction: (fn: any) => fn({ getRepository: (e: any) => (e.name === 'LogisticsPrinter' ? txPrinters : txBajas) }) };
  return { svc: new LogisticsService(printers, {} as any, decommissions, users, dataSource), printers, decommissions, txPrinters, txBajas };
}

describe('DTOs de Logística', () => {
  it('valida impresora, envío y baja', async () => {
    expect(await errorsOf(CreatePrinterDto, { branchId: 1, brand: 'Kyocera', model: 'M2040', serialNumber: 'ABC1' })).toEqual([]);
    expect(await errorsOf(CreatePrinterDto, { branchId: 1, brand: 'K', model: 'M', serialNumber: 'A', status: 'BAJA' })).toContain('status');
    expect(await errorsOf(CreateShipmentDto, { branchId: 1, type: 'TONER', description: 'TK-1175' })).toEqual([]);
    expect(await errorsOf(CreateShipmentDto, { branchId: 1, type: 'CAJA', description: 'x' })).toContain('type');
    expect(await errorsOf(CreateDecommissionDto, { branchId: 1, brand: 'K', model: 'M', serialNumber: 'A' })).toContain('reason');
  });
});

describe('LogisticsService', () => {
  it('no deja dar de alta dos impresoras con la misma serie', async () => {
    const { svc } = make({ printer: { id: 3, serialNumber: 'ABC1' } });
    await expect(svc.createPrinter({ branchId: 1, brand: 'K', model: 'M', serialNumber: 'abc1' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('la solicitud de baja queda pendiente, con serie en mayúsculas, ligada al inventario y con quién la pidió', async () => {
    const { svc } = make({ printer: { id: 3, serialNumber: 'ABC1', status: 'ASIGNADA' } });
    const baja = await svc.requestDecommission({ branchId: 1, ticketId: 7, brand: 'K', model: 'M', serialNumber: ' abc1 ', counter: 150000, reason: 'Fusor dañado' }, 9);
    expect(baja).toMatchObject({ status: 'PENDIENTE', serialNumber: 'ABC1', printerId: 3, ticketId: 7, counter: 150000, requestedByName: 'Ana Ruiz' });
  });

  it('no permite dos bajas pendientes de la misma serie ni dar de baja lo que ya está en baja', async () => {
    await expect(make({ pendingBaja: { id: 1 } }).svc.requestDecommission({ branchId: 1, brand: 'K', model: 'M', serialNumber: 'A', reason: 'x' }))
      .rejects.toBeInstanceOf(ConflictException);
    await expect(make({ printer: { id: 3, status: 'BAJA' } }).svc.requestDecommission({ branchId: 1, brand: 'K', model: 'M', serialNumber: 'A', reason: 'x' }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('autorizar marca la impresora como BAJA con el contador de la baja', async () => {
    const printer = { id: 3, serialNumber: 'ABC1', status: 'ASIGNADA', counter: 100 };
    const { svc, txPrinters } = make({ printer, baja: { id: 5, status: 'PENDIENTE', printerId: 3, serialNumber: 'ABC1', counter: 150000 } });
    const result = await svc.authorize(5, 9, 'ok');
    expect(result).toMatchObject({ status: 'AUTORIZADA', reviewedByName: 'Ana Ruiz', reviewNotes: 'ok' });
    expect(txPrinters.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'BAJA', counter: 150000, decommissionedAt: expect.any(Date) }));
  });

  it('rechazar exige motivo y una baja ya revisada no se puede volver a revisar', async () => {
    await expect(make({ baja: { id: 5, status: 'PENDIENTE' } }).svc.reject(5, 9, ' ')).rejects.toBeInstanceOf(BadRequestException);
    await expect(make({ baja: { id: 5, status: 'AUTORIZADA' } }).svc.authorize(5, 9)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('solo acepta PDF, PNG o JPG', () => {
    expect(detectFileType(Buffer.from('%PDF-1.7'))?.ext).toBe('pdf');
    expect(detectFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47]))?.ext).toBe('png');
    expect(detectFileType(Buffer.from([0xff, 0xd8, 0xff]))?.ext).toBe('jpg');
    expect(detectFileType(Buffer.from('MZ executable'))).toBeNull();
  });
});
