import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserModule } from '../user/user.module';
import { CommentsService } from './comments.service';
import {
    BuildCommentsController,
    CommentsController,
} from './comments.controller';

@Module({
    // UserModule нужен NotMutedGuard'у: мут читается из базы, а не из токена.
    imports: [PrismaModule, UserModule],
    controllers: [BuildCommentsController, CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule {}
