import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

/** Максимум года достаточно: всё, что дольше, админ выдаёт бессрочным мутом. */
const maxMuteMinutes = 525_600;

export class MuteUserDto {
    /**
     * Длительность в минутах. Поле опущено — мут бессрочный: срок задаёт
     * админ, а не список пресетов.
     */
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(maxMuteMinutes)
    minutes?: number;

    @IsOptional()
    @IsString()
    @Length(1, 200)
    reason?: string;
}
