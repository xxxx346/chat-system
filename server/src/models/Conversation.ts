import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: 'enum', enum: ['private', 'group'] })
  type: 'private' | 'group'

  @Column({ length: 100, nullable: true })
  name: string

  @Column({ length: 200, nullable: true })
  avatar: string

  @Column({ type: 'text', nullable: true })
  last_message: string

  @Column({ type: 'timestamp', nullable: true })
  last_message_time: Date

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date
}
