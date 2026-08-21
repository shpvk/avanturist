import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BuildsService } from '../builds/builds.service';
import { type BuildView } from '../builds/build.view';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteEntity } from './vote.entity';

@Injectable()
export class VotesService {
    constructor(
        @InjectRepository(VoteEntity)
        private readonly votes: Repository<VoteEntity>,
        private readonly buildsService: BuildsService,
    ) {}

    /** Повторный голос того же посетителя заменяет предыдущий. */
    async vote(buildId: string, dto: CreateVoteDto): Promise<BuildView> {
        await this.buildsService.getEntityOrFail(buildId);

        const existing = await this.votes.findOne({
            where: { buildId, voterKey: dto.voterKey },
        });

        await this.votes.save(
            existing
                ? { ...existing, verdict: dto.verdict }
                : this.votes.create({ buildId, verdict: dto.verdict, voterKey: dto.voterKey }),
        );

        return this.buildsService.findOne(buildId);
    }
}
