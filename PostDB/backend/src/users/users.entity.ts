import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Certification } from './certification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column()
  role: string;

  @Column({ nullable: true })
  department: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ name: 'last_training_date', type: 'date', nullable: true })
  lastTrainingDate: Date;

  @OneToMany(() => Certification, cert => cert.user)
  certifications: Certification[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
