import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/** Общая форма «введите почту»: повторная верификация и запрос сброса пароля. */
export class EmailRequestDto {
    @IsString({ message: 'Email must be a string.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;

    @IsOptional()
    @IsString({ message: 'Captcha token must be a string.' })
    turnstileToken?: string;
}
