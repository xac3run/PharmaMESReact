import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from '../users/users.entity';
import { ElectronicSignature } from './electronic-signature.entity';

@Entity('audit_trail')
export class AuditTrail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sequence_number', type: 'bigint' })
  sequenceNumber: number;

  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string;

  @Column({ name: 'action_type' })
  actionType: string;

  @Column({ name: 'table_name', nullable: true })
  tableName: string;

  @Column({ name: 'record_id', nullable: true })
  recordId: string;

  @Column({ name: 'old_values', type: 'jsonb', nullable: true })
  oldValues: any;

  @Column({ name: 'new_values', type: 'jsonb', nullable: true })
  newValues: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'user_agent', nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  reason: string;

  @Column({ name: 'parent_audit_id', type: 'uuid', nullable: true })
  parentAuditId: string;

  @Column({ name: 'data_hash' })
  dataHash: string;

  @Column({ name: 'previous_hash', nullable: true })
  previousHash: string;

  @OneToMany(() => ElectronicSignature, signature => signature.auditTrail)
  signatures: ElectronicSignature[];

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
