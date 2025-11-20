export enum TypeOfReport {
  FAILURE = 'FAILURE',                         // Falla general del equipo
  REPLACEMENT = 'REPLACEMENT',                 // Reemplazo de componente o dispositivo
  RELOCATION = 'RELOCATION',                   // Reubicación de equipo a otra ubicación
  MAINTENANCE = 'MAINTENANCE',                 // Mantenimiento preventivo o correctivo
  INSTALLATION = 'INSTALLATION',               // Instalación de hardware o software
  SUPPORT = 'SUPPORT',                         // Soporte técnico general
  COLLECTION = 'COLLECTION',                   // Recolección de equipo dañado o en desuso
  REMOTE_CONFIGURATION = 'REMOTE_CONFIGURATION', // Configuración remota
  TONER_DELIVERY = 'TONER_DELIVERY',           // Entrega de tóner o consumibles
  APOYO_VILLA = 'APOYO_VILLA', //AQUI SERIA APOYO A OTRA SUCURSAL DE LA MISMA EMPRESA PERO DE OTRA UBICACION
  APOYO_CDMX = 'APOYO_CDMX',
  APOYO_CANCUN = 'APOYO_CANCUN',
  APOYO_MTY = "APOYO_MTY",
    // 🔥 NUEVOS TIPOS (los que pediste)
  COMPUTER_REPAIR = 'COMPUTER_REPAIR',         // Reparación de cómputo
  MULTIFUNCTION_REPAIR = 'MULTIFUNCTION_REPAIR', // Reparación de multifuncional
  REFURBISHED_PART = 'REFURBISHED_PART',       // Reacondicionado de refacción
  MESSAGING = 'MESSAGING',                     // Mensajería
  NUBEPRINT_INSTALLATION = 'NUBEPRINT_INSTALLATION', // Instalación de Nubeprint
  ON_SITE_READINGS = 'ON_SITE_READINGS',       // Lecturas en sitio
  NUBEPRINT_READINGS = 'NUBEPRINT_READINGS',   // Lecturas Nubeprint
  PROJECT_SURVEY = 'PROJECT_SURVEY',           // Levantamiento de proyecto
  UNREGISTERED_CLIENT = 'UNREGISTERED_CLIENT', // Cliente no registrado
}
