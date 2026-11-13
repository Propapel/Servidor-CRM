import 'reflect-metadata';
import { NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DEFAULT_SERVICE_SHEET, UpsertServiceSheetDto } from './dto/service-sheet.dto';
import { ServiceSheetService } from './service-sheet.service';

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]).toString('base64');
const errorsOf = async (body: object) => (await validate(plainToInstance(UpsertServiceSheetDto, body))).map((e) => e.property);

describe('UpsertServiceSheetDto', () => {
  it('acepta el ejemplo completo y un cuerpo vacío', async () => {
    expect(await errorsOf({ ...DEFAULT_SERVICE_SHEET, logoBase64: PNG, footerLines: ['Empresa SA de CV'] })).toEqual([]);
    expect(await errorsOf({})).toEqual([]);
    expect(await errorsOf({ logoBase64: null })).toEqual([]);
  });

  it('rechaza logo con prefijo data:, que no sea PNG/JPG o de más de 400 KB', async () => {
    expect(await errorsOf({ logoBase64: `data:image/png;base64,${PNG}` })).toContain('logoBase64');
    expect(await errorsOf({ logoBase64: Buffer.from('GIF89a....').toString('base64') })).toContain('logoBase64');
    const big = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47]), Buffer.alloc(401 * 1024)]).toString('base64');
    expect(await errorsOf({ logoBase64: big })).toContain('logoBase64');
  });

  it('respeta los límites de textos, listas y líneas', async () => {
    expect(await errorsOf({ title: 'x'.repeat(61) })).toContain('title');
    expect(await errorsOf({ footerLines: Array(7).fill('a') })).toContain('footerLines');
    expect(await errorsOf({ serviceTypes: ['x'.repeat(81)] })).toContain('serviceTypes');
    expect(await errorsOf({ equipmentRows: 9 })).toContain('equipmentRows');
    expect(await errorsOf({ activityLines: 0 })).toContain('activityLines');
    expect(await errorsOf({ commentLines: 0 })).toEqual([]);
    expect(await errorsOf({ showEquipmentTable: 'si' })).toContain('showEquipmentTable');
  });
});

describe('ServiceSheetService', () => {
  const make = (row: any = null, branchExists = true) => {
    const settings: any = { findOneBy: jest.fn().mockResolvedValue(row), save: jest.fn() };
    const branches: any = { exist: jest.fn().mockResolvedValue(branchExists) };
    return { svc: new ServiceSheetService(settings, branches, {} as any), settings };
  };

  it('GET da 404 si la sucursal no tiene formato', async () => {
    await expect(make().svc.get(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('PUT completa con los valores predeterminados y guarda quién lo cambió', async () => {
    const { svc, settings } = make();
    const saved = await svc.upsert(3, { title: ' HOJA ', footerLines: ['Empresa', ' '] }, 9);
    expect(saved).toEqual({ ...DEFAULT_SERVICE_SHEET, title: 'HOJA', footerLines: ['Empresa'] });
    expect(settings.save).toHaveBeenCalledWith({ branchId: 3, config: saved, updatedBy: 9 });
  });

  it('PUT da 404 si la sucursal no existe', async () => {
    await expect(make(null, false).svc.upsert(99, {})).rejects.toBeInstanceOf(NotFoundException);
  });
});
