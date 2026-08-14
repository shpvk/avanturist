import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('items')
@Index('uq_items_dota_id', ['dotaId'], { unique: true })
@Index('uq_items_slug', ['slug'], { unique: true })
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'dota_id', type: 'integer' })
  dotaId!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100 })
  slug!: string;

  @Column({ name: 'image_key', type: 'varchar', length: 100 })
  imageKey!: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
