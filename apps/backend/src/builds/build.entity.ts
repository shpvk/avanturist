import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { CommentEntity } from '../comments/comment.entity';
import { VoteEntity } from '../votes/vote.entity';

@Entity('builds')
@Index(['createdAt'])
export class BuildEntity {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /** Название придумывает автор: оно передаёт авантюрную идею сборки. */
    @Column({ type: 'varchar', length: 80 })
    title!: string;

    @Column({ name: 'hero_id', type: 'varchar', length: 60 })
    heroId!: string;

    /** Идентификаторы предметов Dota 2 в порядке закупа. */
    @Column({ type: 'text', array: true })
    items!: string[];

    @Column({ type: 'varchar', length: 40, default: 'anonymous' })
    author!: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @OneToMany(() => VoteEntity, (vote) => vote.build)
    votes!: VoteEntity[];

    @OneToMany(() => CommentEntity, (comment) => comment.build)
    comments!: CommentEntity[];
}
