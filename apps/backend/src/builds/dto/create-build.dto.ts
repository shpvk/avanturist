import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsString,
    Length,
    MaxLength,
} from 'class-validator';

export class CreateBuildDto {
    @IsString()
    @Length(3, 80)
    title!: string;

    @IsString()
    @Length(1, 60)
    heroId!: string;

    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(12)
    @IsString({ each: true })
    @MaxLength(60, { each: true })
    items!: string[];
}
