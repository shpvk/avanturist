import {
    IsEmail,
    IsNotEmpty,
    IsOptional,
    IsString,
    MaxLength,
} from 'class-validator';

export class EmailRequestDto {
    @IsString({ message: 'Email must be a string.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    @IsNotEmpty({ message: 'Email is required.' })
    @MaxLength(254, { message: 'Email must be at most 254 characters long.' })
    email!: string;

    @IsOptional()
    @IsString({ message: 'Captcha token must be a string.' })
    @MaxLength(2048, { message: 'Captcha token is too long.' })
    turnstileToken?: string;
}
