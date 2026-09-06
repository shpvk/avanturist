import { IsString, Length } from 'class-validator';

/** Автора сервер берёт из access-токена: комментировать может только вошедший. */
export class CreateCommentDto {
    @IsString()
    @Length(1, 500)
    text!: string;
}
