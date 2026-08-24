import {
    IsEmail,
    IsNotEmpty,
    IsString,
    MinLength,
} from 'class-validator';

export class LoginDto {
    @IsString({ message: 'Name must be a string.' })
    @IsNotEmpty({ message: 'Name is required.' })
    username!: string;

    @IsString({ message: 'Email must be a string.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    email?: string;

    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password is required.' })
    password!: string;

}
