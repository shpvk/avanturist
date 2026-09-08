import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PublicProfile, UserService } from './user.service';
import {
    AvatarStorageService,
    maxAvatarBytes,
    UploadedImage,
} from './avatar-storage.service';
import { MuteUserDto } from './dto/mute-user.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/enums';

export interface AvatarView {
    picture: string | null;
}

export interface MuteView {
    userId: string;
    muted: boolean;
    mutedUntil: string | null;
    reason: string | null;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
    public constructor(
        private readonly userService: UserService,
        private readonly avatarStorage: AvatarStorageService,
    ) {}

    @ApiConsumes('multipart/form-data')
    @Throttle({ medium: { ttl: 60_000, limit: 10 } })
    @HttpCode(HttpStatus.OK)
    @Post('me/avatar')
    @UseInterceptors(
        FileInterceptor('file', { limits: { fileSize: maxAvatarBytes, files: 1 } }),
    )
    public async uploadAvatar(
        @CurrentUser('id') userId: string,
        @UploadedFile() file?: UploadedImage,
    ): Promise<AvatarView> {
        const current = await this.userService.findById(userId);
        const picture = await this.avatarStorage.save(file);

        await this.userService.updatePicture(userId, picture);
        await this.avatarStorage.remove(current.picture);

        return { picture };
    }

    @HttpCode(HttpStatus.OK)
    @Delete('me/avatar')
    public async removeAvatar(
        @CurrentUser('id') userId: string,
    ): Promise<AvatarView> {
        const current = await this.userService.findById(userId);

        await this.userService.updatePicture(userId, null);
        await this.avatarStorage.remove(current.picture);

        return { picture: null };
    }

    @Public()
    @Get(':id')
    public profile(@Param('id') id: string): Promise<PublicProfile> {
        return this.userService.publicProfile(id);
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Post(':id/mute')
    public async mute(
        @Param('id') id: string,
        @Body() dto: MuteUserDto,
        @CurrentUser('id') adminId: string,
    ): Promise<MuteView> {
        if (id === adminId) {
            throw new BadRequestException('You cannot mute yourself.');
        }

        const target = await this.userService.findByIdOrNull(id);

        if (!target) {
            throw new NotFoundException('User not found');
        }

        const until = dto.minutes
            ? new Date(Date.now() + dto.minutes * 60_000)
            : null;

        await this.userService.mute({
            userId: id,
            until,
            reason: dto.reason ?? null,
            byId: adminId,
        });

        return {
            userId: id,
            muted: true,
            mutedUntil: until?.toISOString() ?? null,
            reason: dto.reason ?? null,
        };
    }

    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.OK)
    @Delete(':id/mute')
    public async unmute(@Param('id') id: string): Promise<MuteView> {
        const target = await this.userService.findByIdOrNull(id);

        if (!target) {
            throw new NotFoundException('User not found');
        }

        await this.userService.unmute(id);

        return { userId: id, muted: false, mutedUntil: null, reason: null };
    }
}
