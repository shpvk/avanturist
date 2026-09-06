import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

const maxMuteMinutes = 525_600;

export class MuteUserDto {
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
