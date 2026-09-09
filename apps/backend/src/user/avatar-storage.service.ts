import {
    BadRequestException,
    Injectable,
    PayloadTooLargeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

export const avatarPublicPrefix = '/uploads/avatars';
export const maxAvatarBytes = 2 * 1024 * 1024;

const allowedExtensions = ['png', 'jpg', 'webp'] as const;

export interface UploadedImage {
    mimetype?: string;
    size?: number;
    buffer?: Buffer;
}

function detectExtension(bytes: Buffer): string | null {
    if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return 'png';
    }

    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return 'jpg';
    }

    if (
        bytes.length >= 12 &&
        bytes.subarray(0, 4).toString('ascii') === 'RIFF' &&
        bytes.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'webp';
    }

    return null;
}

@Injectable()
export class AvatarStorageService {
    private readonly directory: string;

    public constructor(configService: ConfigService) {
        const root = configService.get<string>('UPLOADS_DIR')?.trim();

        this.directory = resolve(root || join(process.cwd(), 'uploads'), 'avatars');
    }

    public get root(): string {
        return this.directory;
    }

    public async save(file: UploadedImage | undefined): Promise<string> {
        const buffer = file?.buffer;

        if (!buffer?.length) {
            throw new BadRequestException('Файл не получен.');
        }

        if (buffer.length > maxAvatarBytes) {
            throw new PayloadTooLargeException('Файл больше 2 МБ.');
        }

        const extension = detectExtension(buffer);

        if (!extension) {
            throw new BadRequestException(
                'Поддерживаются только изображения PNG, JPEG и WebP.',
            );
        }

        await mkdir(this.directory, { recursive: true });

        const name = `${randomUUID()}.${extension}`;

        await writeFile(join(this.directory, name), buffer);

        return `${avatarPublicPrefix}/${name}`;
    }

    public async remove(picture: string | null): Promise<void> {
        const name = this.ownFileName(picture);

        if (!name) {
            return;
        }

        await unlink(join(this.directory, name)).catch(() => undefined);
    }

    private ownFileName(picture: string | null): string | null {
        if (!picture?.startsWith(`${avatarPublicPrefix}/`)) {
            return null;
        }

        const name = picture.slice(avatarPublicPrefix.length + 1);
        const pattern = new RegExp(`^[\\w-]+\\.(${allowedExtensions.join('|')})$`);

        return pattern.test(name) ? name : null;
    }
}
