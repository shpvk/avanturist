import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BuildsModule } from '../builds/builds.module';
import { VotesController } from './votes.controller';
import { VotesService } from './votes.service';

@Module({
    imports: [PrismaModule, BuildsModule],
    controllers: [VotesController],
    providers: [VotesService],
})
export class VotesModule {}
