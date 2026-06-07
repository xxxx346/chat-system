import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity('conversation_members')
export class ConversationMember {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  conversation_id: number

  @Column()
  user_id: number

  @Column({ length: 50, nullable: true })
  nickname: string

  @CreateDateColumn({ type: 'timestamp' })
  joined_at: Date
}
