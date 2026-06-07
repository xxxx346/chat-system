import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm'

@Entity('messages')
@Index(['conversation_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  conversation_id: number

  @Column()
  sender_id: number

  @Column({ type: 'enum', enum: ['text', 'image', 'file', 'voice', 'system'] })
  type: 'text' | 'image' | 'file' | 'voice' | 'system'

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ length: 500, nullable: true })
  file_url: string

  @Column({ nullable: true })
  file_size: number

  @Column({ length: 100, nullable: true })
  file_name: string

  @Column({ default: false })
  is_recalled: boolean

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date
}
