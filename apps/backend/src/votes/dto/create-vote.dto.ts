import { IsEnum, IsString, Length } from 'class-validator';
import { Verdict } from '../verdict.enum';

export class CreateVoteDto {
    @IsEnum(Verdict)
    verdict!: Verdict;

    @IsString()
    @Length(1, 64)
    voterKey!: string;
}
