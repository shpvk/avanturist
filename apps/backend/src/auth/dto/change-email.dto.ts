import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ChangeEmailDto {
    @IsString({ message: 'Почта должна быть строкой.' })
    @IsEmail({}, { message: 'Неверный формат почты.' })
    @IsNotEmpty({ message: 'Укажите почту.' })
    @MaxLength(254, { message: 'Почта — максимум 254 символа.' })
    email!: string;

    @IsString({ message: 'Текущий пароль должен быть строкой.' })
    @IsNotEmpty({ message: 'Введите текущий пароль.' })
    @MaxLength(128, { message: 'Текущий пароль — максимум 128 символов.' })
    currentPassword!: string;
}
