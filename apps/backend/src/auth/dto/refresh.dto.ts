import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefreshDto {
    @IsString({ message: 'Refresh token must be a string.' })
    @IsNotEmpty({ message: 'Refresh token is required.' })
    @MaxLength(256, { message: 'Refresh token is malformed.' })
    refreshToken!: string;
}
