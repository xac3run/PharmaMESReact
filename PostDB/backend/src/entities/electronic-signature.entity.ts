import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AuditTrail } from './audit-trail.entity';
import { User } from '../users/users.entity';

@Entity('electronic_signatures')
export class ElectronicSignature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'audit_trail_id', type: 'uuid' })
  auditTrailId: string;

  @Column({ name: 'signer_user_id', type: 'uuid' })
  signerUserId: string;

  @Column({ name: 'signature_data' })
  signatureData: string;

  @Column({ name: 'signature_method', default: 'HMAC-SHA256' })
  signatureMethod: string;

  @Column({ name: 'signed_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  signedAt: Date;

  @Column()
  reason: string;

  @Column()
  meaning: string;

  @Column({ name: 'ip_address', type: 'inet', nullable: true })
  ipAddress: string;

  @Column({ name: 'certificate_id', type: 'uuid', nullable: true })
  certificateId: string;

  @ManyToOne(() => AuditTrail)
  @JoinColumn({ name: 'audit_trail_id' })
  auditTrail: AuditTrail;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'signer_user_id' })
  signer: User;
}
