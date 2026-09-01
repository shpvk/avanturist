import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
    @IsString({ message: 'Email must be a string.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    email!: string;

    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password is required.' })
    password!: string;

    @IsOptional()
    @IsString({ message: 'Captcha token must be a string.' })
    turnstileToken?: string;
}
