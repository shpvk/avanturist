import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { CommentsService } from './comments.service';
import {
    BuildCommentsController,
    CommentsController,
} from './comments.controller';

@Module({
    imports: [PrismaModule, UserModule],
    controllers: [BuildCommentsController, CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule {}
