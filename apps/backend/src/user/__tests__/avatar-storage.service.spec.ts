import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdtemp, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AvatarStorageService } from '../avatar-storage.service';

const pngBytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16),
]);

async function service(): Promise<{ storage: AvatarStorageService; root: string }> {
    const root = await mkdtemp(join(tmpdir(), 'avatar-storage-'));
    const config = { get: () => root } as unknown as ConfigService;

    return { storage: new AvatarStorageService(config), root: join(root, 'avatars') };
}

describe('AvatarStorageService', () => {
    it('тип берёт из содержимого файла, а не из mimetype запроса', async () => {
        const { storage, root } = await service();

        const picture = await storage.save({ mimetype: 'image/webp', buffer: pngBytes });

        expect(picture).toMatch(/^\/uploads\/avatars\/[\w-]+\.png$/);
        await expect(readdir(root)).resolves.toHaveLength(1);
    });

    it('файл, который не является картинкой, не сохраняется', async () => {
        const { storage } = await service();

        await expect(
            storage.save({ mimetype: 'image/png', buffer: Buffer.from('<svg/>') }),
        ).rejects.toThrow(BadRequestException);
    });

    it('удаляет только свои файлы и не выходит за пределы папки', async () => {
        const { storage, root } = await service();
        const picture = await storage.save({ buffer: pngBytes });
        await writeFile(join(root, 'keep.png'), pngBytes);

        await storage.remove('https://example.com/photo.png');
        await storage.remove('/uploads/avatars/../keep.png');
        await expect(readdir(root)).resolves.toHaveLength(2);

        await storage.remove(picture);
        await expect(readdir(root)).resolves.toEqual(['keep.png']);
    });
});
