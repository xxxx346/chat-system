import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('friend_requests')
export class FriendRequest {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  sender_id: number

  @Column()
  receiver_id: number

  @Column({ type: 'enum', enum: ['pending', 'accepted', 'rejected'], default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected'

  @Column({ type: 'text', nullable: true })
  message: string

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date
}
