import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Marca una ruta (o un controlador completo) como accesible sin token. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
