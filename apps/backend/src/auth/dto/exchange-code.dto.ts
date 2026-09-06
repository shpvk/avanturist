import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ExchangeCodeDto {
    @IsString({ message: 'Code must be a string.' })
    @IsNotEmpty({ message: 'Code is required.' })
    @MaxLength(128, { message: 'Code is too long.' })
    code!: string;
}
