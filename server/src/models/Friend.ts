import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique } from 'typeorm'

@Entity('friends')
@Unique(['user_id', 'friend_id'])
export class Friend {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  user_id: number

  @Column()
  friend_id: number

  @Column({ nullable: true })
  group_id: number

  @Column({ length: 50, nullable: true })
  remark: string

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date
}
