import { Exclude } from 'class-transformer';
import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BuildEntity } from '../builds/build.entity';
import { Verdict } from './verdict.enum';

@Entity('votes')
// Один голос на билд от одного посетителя.
@Index(['buildId', 'voterKey'], { unique: true })
export class VoteEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'build_id', type: 'uuid' })
    buildId!: string;

    @ManyToOne(() => BuildEntity, (build) => build.votes, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'build_id' })
    build!: BuildEntity;

    @Column({ type: 'enum', enum: Verdict })
    verdict!: Verdict;

    /** Анонимный идентификатор голосующего до появления авторизации. */
    @Exclude()
    @Column({ name: 'voter_key', type: 'varchar', length: 64 })
    voterKey!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
