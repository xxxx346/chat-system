import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true, length: 50 })
  username: string

  @Column({ unique: true, length: 100 })
  email: string

  @Column()
  password_hash: string

  @Column({ length: 50, nullable: true })
  nickname: string

  @Column({ length: 200, nullable: true })
  avatar: string

  @Column({ type: 'enum', enum: ['online', 'offline'], default: 'offline' })
  status: 'online' | 'offline'

  @Column({ type: 'text', nullable: true })
  signature: string

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date
}
