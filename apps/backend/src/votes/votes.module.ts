import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuildsModule } from '../builds/builds.module';
import { VoteEntity } from './vote.entity';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
    imports: [TypeOrmModule.forFeature([VoteEntity]), BuildsModule],
    controllers: [VotesController],
    providers: [VotesService],
})
export class VotesModule {}
