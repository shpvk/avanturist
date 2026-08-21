import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, Length } from 'class-validator';

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
    items!: string[];

    @IsOptional()
    @IsString()
    @Length(2, 40)
    author?: string;
}
