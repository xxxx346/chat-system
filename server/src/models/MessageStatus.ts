import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('message_status')
export class MessageStatus {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  message_id: number

  @Column()
  user_id: number

  @Column({ type: 'enum', enum: ['sent', 'delivered', 'read'], default: 'sent' })
  status: 'sent' | 'delivered' | 'read'

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date
}
