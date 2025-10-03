import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './users.entity';

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, user => user.certifications)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'certification_name' })
  certificationName: string;

  @Column({ name: 'issued_date', type: 'date' })
  issuedDate: Date;

  @Column({ name: 'expiry_date', type: 'date', nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  issuer: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
