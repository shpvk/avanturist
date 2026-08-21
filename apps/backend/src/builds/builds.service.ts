import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HeroesService } from '../heroes/heroes.service';
import { BuildEntity } from './build.entity';
import { toBuildView, type BuildView } from './build.view';
import { CreateBuildDto } from './dto/create-build.dto';

const RELATIONS = { votes: true, comments: true } as const;

@Injectable()
export class BuildsService {
    constructor(
        @InjectRepository(BuildEntity)
        private readonly builds: Repository<BuildEntity>,
        private readonly heroes: HeroesService,
    ) {}

    async create(dto: CreateBuildDto): Promise<BuildView> {
        if (!this.heroes.exists(dto.heroId)) {
            throw new BadRequestException(`Unknown hero "${dto.heroId}"`);
        }

        const build = await this.builds.save(
            this.builds.create({
                title: dto.title,
                heroId: dto.heroId,
                items: dto.items,
                author: dto.author ?? 'anonymous',
            }),
        );

        return this.findOne(build.id);
    }

    /** Лента всех сборок: по умолчанию от новых к старым. */
    async findAll(): Promise<BuildView[]> {
        const builds = await this.builds.find({
            relations: RELATIONS,
            order: { createdAt: 'DESC' },
        });

        return builds.map((build) => this.toView(build));
    }

    async findOne(id: string): Promise<BuildView> {
        return this.toView(await this.getEntityOrFail(id));
    }

    /** Главная страница: случайная сборка со случайным героем. */
    async findRandom(): Promise<BuildView> {
        const { id } =
            (await this.builds
                .createQueryBuilder('build')
                .select('build.id', 'id')
                .orderBy('RANDOM()')
                .limit(1)
                .getRawOne<{ id: string }>()) ?? {};

        if (!id) {
            throw new NotFoundException('No builds published yet');
        }

        return this.findOne(id);
    }

    async getEntityOrFail(id: string): Promise<BuildEntity> {
        const build = await this.builds.findOne({ where: { id }, relations: RELATIONS });

        if (!build) {
            throw new NotFoundException(`Build "${id}" not found`);
        }

        return build;
    }

    private toView(build: BuildEntity): BuildView {
        return toBuildView(build, this.heroes.findOne(build.heroId));
    }
}
