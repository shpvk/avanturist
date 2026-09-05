import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    HttpCode,
    HttpStatus,
    NotFoundException,
    Param,
    Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { MuteUserDto } from './dto/mute-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../generated/prisma/enums';

/** Состояние мута в том виде, в каком его читает интерфейс модератора. */
export interface MuteView {
    userId: string;
    muted: boolean;
    /** `null` у бессрочного мута и у снятого. */
    mutedUntil: string | null;
    reason: string | null;
}

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
    public constructor(private readonly userService: UserService) {}

    /**
     * Мут закрывает только комментарии: голосовать и публиковать билды
     * пользователь продолжает.
     */
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
