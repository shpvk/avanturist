import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Снимает глобальный JwtAuthGuard с маршрута. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
