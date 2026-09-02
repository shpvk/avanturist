import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class VerifyEmailDto {
    @IsString({ message: 'Token must be a string.' })
    @IsNotEmpty({ message: 'Token is required.' })
    @MaxLength(128, { message: 'Token is malformed.' })
    token!: string;
}
