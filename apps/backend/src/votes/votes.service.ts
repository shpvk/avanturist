import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BuildsService, PublicBuild } from '../builds/builds.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { Verdict } from './verdict.enum';
import { VoteVerdict } from '../generated/prisma/enums';

const toStored: Record<Verdict, VoteVerdict> = {
    [Verdict.Positive]: VoteVerdict.POSITIVE,
    [Verdict.Situational]: VoteVerdict.SITUATIONAL,
    [Verdict.Negative]: VoteVerdict.NEGATIVE,
};

@Injectable()
export class VotesService {
    public constructor(
        private readonly prismaService: PrismaService,
        private readonly buildsService: BuildsService,
    ) {}

    public async cast(
        buildId: string,
        dto: CreateVoteDto,
        voterId?: string,
    ): Promise<PublicBuild> {
        const verdict = toStored[dto.verdict];

        await this.prismaService.$transaction(async tx => {
            const build = await tx.build.findUnique({
                where: { id: buildId },
                select: { id: true },
            });

            if (!build) {
                throw new NotFoundException(`Build "${buildId}" not found`);
            }

            await tx.vote.upsert({
                where: { buildId_voterKey: { buildId, voterKey: dto.voterKey } },
                update: { verdict, voterId: voterId ?? null },
                create: { buildId, voterKey: dto.voterKey, voterId: voterId ?? null, verdict },
            });

            const counts = await tx.vote.groupBy({
                by: ['verdict'],
                where: { buildId },
                _count: { _all: true },
            });

            const tally = new Map(counts.map(row => [row.verdict, row._count._all]));

            await tx.build.update({
                where: { id: buildId },
                data: {
                    positiveVotes: tally.get(VoteVerdict.POSITIVE) ?? 0,
                    situationalVotes: tally.get(VoteVerdict.SITUATIONAL) ?? 0,
                    negativeVotes: tally.get(VoteVerdict.NEGATIVE) ?? 0,
                },
            });
        });

        return this.buildsService.findOne(buildId);
    }
}
