import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';

export type FeedSort = 'new' | 'popular';

export const maxPageSize = 48;

export class FeedQueryDto {
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'page must be an integer.' })
    @Min(1, { message: 'page starts at 1.' })
    page: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'pageSize must be an integer.' })
    @Min(1, { message: 'pageSize starts at 1.' })
    @Max(maxPageSize, { message: `pageSize must be at most ${maxPageSize}.` })
    pageSize: number = 12;

    @IsOptional()
    @IsString()
    @MaxLength(80, { message: 'search must be at most 80 characters long.' })
    search?: string;

    @IsOptional()
    @IsString()
    @MaxLength(60, { message: 'hero must be at most 60 characters long.' })
    hero?: string;

    @IsOptional()
    @IsUUID(undefined, { message: 'author must be a user id.' })
    author?: string;

    @IsOptional()
    @IsIn(['new', 'popular'], { message: 'sort must be "new" or "popular".' })
    sort: FeedSort = 'new';
}
