import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('friend_groups')
export class FriendGroup {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  user_id: number

  @Column({ length: 50 })
  name: string

  @Column({ default: 0 })
  sort_order: number

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date
}
