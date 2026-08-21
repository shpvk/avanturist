import { Body, Controller, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { BuildEntity } from '../builds/build.entity';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VotesService } from './votes.service';

@Controller('builds/:buildId/votes')
export class VotesController {
    constructor(private readonly votesService: VotesService) {}

    @Post()
    vote(
        @Param('buildId', ParseUUIDPipe) buildId: string,
        @Body() dto: CreateVoteDto,
    ): Promise<BuildEntity> {
        return this.votesService.vote(buildId, dto);
    }
}
