import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Одноразовый код, которым фронт забирает пару токенов после возврата от Google. */
export class ExchangeCodeDto {
    @IsString({ message: 'Code must be a string.' })
    @IsNotEmpty({ message: 'Code is required.' })
    @MaxLength(128, { message: 'Code is too long.' })
    code!: string;
}
