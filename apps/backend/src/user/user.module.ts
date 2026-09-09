import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { UserService } from './user.service';
import { AvatarStorageService } from './avatar-storage.service';
import { UserController } from './user.controller';

@Module({
    imports: [PrismaModule],
    controllers: [UserController],
    providers: [UserService, AvatarStorageService],
    exports: [UserService, AvatarStorageService],
})
export class UserModule {}
