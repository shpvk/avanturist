import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
    @IsString({ message: 'Ник должен быть строкой.' })
    @IsNotEmpty({ message: 'Укажите ник.' })
    @MinLength(2, { message: 'Ник — минимум 2 символа.' })
    @MaxLength(40, { message: 'Ник — максимум 40 символов.' })
    displayName!: string;
}
