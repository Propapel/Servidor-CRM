import { Router, Request, Response } from 'express';
import GoogleAdMobService from '../services/GoogleAdMobService';

const router = Router();

// Función auxiliar para obtener el servicio
const getAdMobService = () => GoogleAdMobService.getInstance();

/**
 * Función genérica para manejar la carga de Ads (Banner, Interstitial, Rewarded)
 */
const handleAdLoad = async (req: Request, res: Response, format: string, envId: string | undefined) => {
  try {
    const service = getAdMobService();
    const adUnitId = req.query.adUnitId as string || envId;

    if (!adUnitId || !service.validateAdUnitId(adUnitId)) {
      return res.status(400).json({
        success: false,
        error: 'Ad Unit ID inválido o no proporcionado.'
      });
    }

    // Simulando el registro de la impresión en la base de datos o sistema
    console.log(`[AdMob] Cargando ${format} para UnitID: ${adUnitId}`);

    return res.status(200).json({
      success: true,
      adUnitId: adUnitId,
      adFormat: format,
      impressionId: `imp-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[AdMob] Error en handleAdLoad (${format}):`, error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al cargar el anuncio'
    });
  }
};

// GET /banner - Cargar banner
router.get('/banner', async (req: Request, res: Response) => {
  await handleAdLoad(req, res, 'banner', process.env.ADMOB_BANNER_UNIT_ID);
});

// GET /interstitial - Cargar intersticial
router.get('/interstitial', async (req: Request, res: Response) => {
  await handleAdLoad(req, res, 'interstitial', process.env.ADMOB_INTERSTITIAL_UNIT_ID);
});

// GET /rewarded - Cargar rewarded
router.get('/rewarded', async (req: Request, res: Response) => {
  await handleAdLoad(req, res, 'rewarded', process.env.ADMOB_REWARDED_UNIT_ID);
});

// POST /click - Registrar click
router.post('/click', async (req: Request, res: Response) => {
  try {
    const { adUnitId, impressionId } = req.body;

    if (!adUnitId || !impressionId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: adUnitId, impressionId'
      });
    }

    console.log(`[AdMob] Registrando click para impression: ${impressionId}`);

    return res.status(200).json({
      success: true,
      message: 'Click registrado exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[AdMob] Error registrando click:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar el click'
    });
  }
});

// POST /reward - Registrar reward completado
router.post('/reward', async (req: Request, res: Response) => {
  try {
    const { adUnitId, impressionId, userId } = req.body;

    if (!adUnitId || !impressionId) {
      return res.status(400).json({
        success: false,
        error: 'Faltan parámetros requeridos: adUnitId, impressionId'
      });
    }

    console.log(`[AdMob] Recompensa completada - Impression: ${impressionId}, User: ${userId || 'guest'}`);

    return res.status(200).json({
      success: true,
      reward: {
        type: 'coins',
        amount: 10
      },
      message: 'Recompensa registrada exitosamente',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[AdMob] Error registrando reward:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al registrar la recompensa'
    });
  }
});

// GET /earnings/today - Ganancias de hoy
router.get('/earnings/today', async (req: Request, res: Response) => {
  try {
    const service = getAdMobService();
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`[AdMob] Consultando ganancias de hoy (${today})...`);
    const report = await service.getEarningsReport(today, today);

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('[AdMob] Error en /earnings/today:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener las ganancias de hoy'
    });
  }
});

// GET /earnings/month - Ganancias del mes
router.get('/earnings/month', async (req: Request, res: Response) => {
  try {
    const service = getAdMobService();
    
    console.log(`[AdMob] Consultando ganancias del mes actual...`);
    const report = await service.getMonthlyEarnings();

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('[AdMob] Error en /earnings/month:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener las ganancias del mes'
    });
  }
});

// GET /earnings/summary - Resumen completo
router.get('/earnings/summary', async (req: Request, res: Response) => {
  try {
    const service = getAdMobService();
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren startDate y endDate en query parameters (YYYY-MM-DD)'
      });
    }

    console.log(`[AdMob] Consultando resumen de ganancias (${startDate} a ${endDate})...`);
    const report = await service.getEarningsReport(startDate as string, endDate as string);

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error: any) {
    console.error('[AdMob] Error en /earnings/summary:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al obtener el resumen de ganancias'
    });
  }
});

export default router;
