import { Body, Controller, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { VotesService } from './votes.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { PublicBuild } from '../builds/builds.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { AuthenticatedUser } from '../auth/interfaces/auth.interfaces';

@ApiTags('votes')
@Controller('builds/:buildId/votes')
export class VotesController {
    public constructor(private readonly votesService: VotesService) {}

    @Public()
    @UseGuards(OptionalJwtAuthGuard)
    @Throttle({ short: { ttl: 1_000, limit: 3 }, medium: { ttl: 60_000, limit: 60 } })
    @HttpCode(HttpStatus.OK)
    @Post()
    public cast(
        @Param('buildId') buildId: string,
        @Body() dto: CreateVoteDto,
        @CurrentUser() voter: AuthenticatedUser | undefined,
    ): Promise<PublicBuild> {
        return this.votesService.cast(buildId, dto, voter?.id);
    }
}
