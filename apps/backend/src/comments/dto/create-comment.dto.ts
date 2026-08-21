import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
    @IsString()
    @Length(2, 40)
    author!: string;

    @IsString()
    @Length(1, 2000)
    text!: string;
}
