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

@Entity('comments')
@Index(['buildId', 'createdAt'])
export class CommentEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'build_id', type: 'uuid' })
    buildId!: string;

    @ManyToOne(() => BuildEntity, (build) => build.comments, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'build_id' })
    build!: BuildEntity;

    @Column({ type: 'varchar', length: 40 })
    author!: string;

    @Column({ type: 'text' })
    text!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}
