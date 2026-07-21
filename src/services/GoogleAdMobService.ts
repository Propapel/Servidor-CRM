import { google, admob_v1 } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

export interface AdMobAccount {
  name: string;
  publisherId: string;
  currencyCode: string;
  reportingTimeZone: string;
}

export interface AdUnit {
  name: string;
  adUnitId: string;
  appId: string;
  displayName: string;
  adTypes: string[];
}

export interface ReportRow {
  date: string;
  adFormat: string;
  platform: string;
  impressions: number;
  clicks: number;
  earnings: number;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalEarnings: number;
  byAdFormat: {
    banner: number;
    interstitial: number;
    rewarded: number;
    native: number;
  };
  byPlatform: {
    android: number;
    ios: number;
    desktop: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    ecpm: number;
  };
}

class GoogleAdMobService {
  private static instance: GoogleAdMobService;
  private admob: admob_v1.Admob;
  private publisherId: string;

  private constructor() {
    this.validateEnv();
    
    this.publisherId = process.env.ADMOB_PUBLISHER_ID!;
    
    console.log('Inicializando GoogleAdMobService...');

    const auth = new GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: [
        'https://www.googleapis.com/auth/admob.readonly',
        'https://www.googleapis.com/auth/admob.report'
      ],
    });

    this.admob = google.admob({
      version: 'v1',
      auth: auth as any,
    });
  }

  public static getInstance(): GoogleAdMobService {
    if (!GoogleAdMobService.instance) {
      GoogleAdMobService.instance = new GoogleAdMobService();
    }
    return GoogleAdMobService.instance;
  }

  private validateEnv() {
    const required = [
      'GOOGLE_APPLICATION_CREDENTIALS',
      'ADMOB_PUBLISHER_ID',
      'ADMOB_BANNER_UNIT_ID',
      'ADMOB_INTERSTITIAL_UNIT_ID',
      'ADMOB_REWARDED_UNIT_ID'
    ];
    for (const req of required) {
      if (!process.env[req]) {
        console.warn(`[AdMobService] Advertencia: Falta variable de entorno ${req}`);
      }
    }
  }

  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.admob.accounts.get({
        name: `accounts/${this.publisherId}`,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching AdMob account info:', error);
      throw new Error('No se pudo obtener la información de la cuenta AdMob');
    }
  }

  async getApps(): Promise<any[]> {
    try {
      const response = await this.admob.accounts.apps.list({
        parent: `accounts/${this.publisherId}`,
      });
      return response.data.apps || [];
    } catch (error) {
      console.error('Error fetching AdMob apps:', error);
      throw new Error('No se pudo obtener la lista de aplicaciones');
    }
  }

  async getAdUnits(appId: string): Promise<any[]> {
    try {
      const parent = appId.startsWith('accounts/') ? appId : `accounts/${this.publisherId}/apps/${appId}`;
      const response = await this.admob.accounts.adUnits.list({
        parent,
      });
      return response.data.adUnits || [];
    } catch (error) {
      console.error('Error fetching AdUnits:', error);
      throw new Error('No se pudo obtener la lista de AdUnits');
    }
  }

  async getAdUnitConfig(adUnitId: string): Promise<any> {
    // Nota: La API de AdMob no tiene un método directo get para un AdUnit aislado, 
    // pero podemos retornarlo validando contra las variables de entorno para esta simulación.
    const isBanner = adUnitId === process.env.ADMOB_BANNER_UNIT_ID;
    const isInterstitial = adUnitId === process.env.ADMOB_INTERSTITIAL_UNIT_ID;
    const isRewarded = adUnitId === process.env.ADMOB_REWARDED_UNIT_ID;

    if (isBanner || isInterstitial || isRewarded) {
      return {
        adUnitId,
        format: isBanner ? 'BANNER' : (isInterstitial ? 'INTERSTITIAL' : 'REWARDED'),
        status: 'ACTIVE'
      };
    }
    
    throw new Error('Ad Unit no encontrado o no configurado en el sistema.');
  }

  validateAdUnitId(adUnitId: string): boolean {
    const validIds = [
      process.env.ADMOB_BANNER_UNIT_ID,
      process.env.ADMOB_INTERSTITIAL_UNIT_ID,
      process.env.ADMOB_REWARDED_UNIT_ID
    ];
    return validIds.includes(adUnitId);
  }

  async getMonthlyEarnings(): Promise<RevenueReport> {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];
    return this.getEarningsReport(startDate, endDate);
  }

  async getEarningsReport(startDate: string, endDate: string): Promise<RevenueReport> {
    try {
      const parseDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
      };

      const response = await this.admob.accounts.networkReport.generate({
        parent: `accounts/${this.publisherId}`,
        requestBody: {
          reportSpec: {
            dateRange: {
              startDate: parseDate(startDate),
              endDate: parseDate(endDate),
            },
            dimensions: ['DATE', 'AD_FORMAT', 'PLATFORM'],
            metrics: ['ESTIMATED_EARNINGS', 'IMPRESSIONS', 'CLICKS'],
          },
        },
      });

      // Procesar datos para adaptarlos al formato requerido por el requerimiento
      const report: RevenueReport = {
        startDate,
        endDate,
        totalEarnings: 0,
        byAdFormat: { banner: 0, interstitial: 0, rewarded: 0, native: 0 },
        byPlatform: { android: 0, ios: 0, desktop: 0 },
        metrics: { impressions: 0, clicks: 0, ctr: 0, ecpm: 0 }
      };

      const rows = response.data;
      if (Array.isArray(rows)) {
        for (const row of rows) {
          if (!row.row) continue;
          
          const dimValues = row.row.dimensionValues || {};
          const metValues = row.row.metricValues || {};

          // Extraer dimensiones
          const adFormat = (dimValues['AD_FORMAT']?.value || '').toLowerCase();
          const platform = (dimValues['PLATFORM']?.value || '').toLowerCase();
          
          // Extraer métricas
          const earnings = (Number(metValues['ESTIMATED_EARNINGS']?.microsValue || 0) / 1000000);
          const impressions = Number(metValues['IMPRESSIONS']?.integerValue || 0);
          const clicks = Number(metValues['CLICKS']?.integerValue || 0);

          // Sumar métricas
          report.totalEarnings += earnings;
          report.metrics.impressions += impressions;
          report.metrics.clicks += clicks;

          // Sumar por formato
          if (adFormat.includes('banner')) report.byAdFormat.banner += earnings;
          else if (adFormat.includes('interstitial')) report.byAdFormat.interstitial += earnings;
          else if (adFormat.includes('rewarded')) report.byAdFormat.rewarded += earnings;
          else if (adFormat.includes('native')) report.byAdFormat.native += earnings;

          // Sumar por plataforma
          if (platform.includes('android')) report.byPlatform.android += earnings;
          else if (platform.includes('ios')) report.byPlatform.ios += earnings;
          else report.byPlatform.desktop += earnings;
        }
      }

      // Calcular CTR y eCPM
      if (report.metrics.impressions > 0) {
        report.metrics.ctr = Number(((report.metrics.clicks / report.metrics.impressions) * 100).toFixed(2));
        report.metrics.ecpm = Number(((report.totalEarnings / report.metrics.impressions) * 1000).toFixed(2));
      }
      
      // Redondear totales
      report.totalEarnings = Number(report.totalEarnings.toFixed(2));
      report.byAdFormat.banner = Number(report.byAdFormat.banner.toFixed(2));
      report.byAdFormat.interstitial = Number(report.byAdFormat.interstitial.toFixed(2));
      report.byAdFormat.rewarded = Number(report.byAdFormat.rewarded.toFixed(2));
      report.byAdFormat.native = Number(report.byAdFormat.native.toFixed(2));
      report.byPlatform.android = Number(report.byPlatform.android.toFixed(2));
      report.byPlatform.ios = Number(report.byPlatform.ios.toFixed(2));
      report.byPlatform.desktop = Number(report.byPlatform.desktop.toFixed(2));

      return report;
    } catch (error: any) {
      console.error('Error fetching Earnings Report:', error?.message || error);
      throw new Error('No se pudo generar el reporte de ganancias');
    }
  }
}

export default GoogleAdMobService;
