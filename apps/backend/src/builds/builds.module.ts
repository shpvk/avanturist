import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BuildsController } from './builds.controller';
import { BuildsService } from './builds.service';

@Module({
    imports: [PrismaModule],
    controllers: [BuildsController],
    providers: [BuildsService],
    exports: [BuildsService],
})
export class BuildsModule {}
