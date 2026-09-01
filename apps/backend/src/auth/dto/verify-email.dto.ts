import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
    @IsString({ message: 'Token must be a string.' })
    @IsNotEmpty({ message: 'Token is required.' })
    token!: string;
}
