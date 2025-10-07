import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import * as crypto from 'crypto';
import { AuditTrail } from '../entities/audit-trail.entity';
import { ElectronicSignature } from '../entities/electronic-signature.entity';
import { UserCertificate } from '../entities/user-certificate.entity';

export interface CreateAuditEntryDto {
  userId: string;
  sessionId: string;
  actionType: string;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ElectronicSignatureDto {
  signedBy: string;
  role: string;
  action: string;
  reason: string;
  timestamp: string;
  ipAddress: string;
  method: string;
  context?: string;
}

export interface AuditQuery {
  userId?: string;
  actionType?: string;
  tableName?: string;
  recordId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @InjectRepository(AuditTrail)
    private auditTrailRepository: Repository<AuditTrail>,
    
    @InjectRepository(ElectronicSignature)
    private signatureRepository: Repository<ElectronicSignature>,
    
    @InjectRepository(UserCertificate)
    private certificateRepository: Repository<UserCertificate>
  ) {}

  async createAuditEntry(data: CreateAuditEntryDto): Promise<AuditTrail> {
    try {
      const lastAudit = await this.auditTrailRepository
        .createQueryBuilder('audit')
        .orderBy('audit.sequenceNumber', 'DESC')
        .limit(1)
        .getOne();

      const previousHash = lastAudit?.dataHash || '0'.repeat(64);
      const timestamp = new Date();
      const dataHash = this.computeAuditHash({
        ...data,
        timestamp,
        previousHash
      });

      const auditEntry = this.auditTrailRepository.create({
        userId: data.userId,
        sessionId: data.sessionId,
        actionType: data.actionType,
        tableName: data.tableName,
        recordId: data.recordId,
        oldValues: data.oldValues,
        newValues: data.newValues,
        timestamp,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        reason: data.reason,
        dataHash,
        previousHash
      });

      const savedEntry = await this.auditTrailRepository.save(auditEntry);
      this.logger.log(`Audit entry created: ${savedEntry.id} - ${data.actionType}`);
      return savedEntry;
    } catch (error) {
      this.logger.error(`Failed to create audit entry: ${error.message}`);
      throw error;
    }
  }

  async createElectronicSignature(
    auditTrailId: string,
    signatureDto: ElectronicSignatureDto,
    userId: string,
    password: string
  ): Promise<ElectronicSignature> {
    try {
      const certificate = await this.getUserCertificate(userId);
      if (!certificate) {
        throw new Error('User certificate not found');
      }

      const signingKey = await this.decryptUserSigningKey(certificate, password);
      const signatureData = this.createHMACSignature(signatureDto, signingKey);

      const signature = this.signatureRepository.create({
        auditTrailId,
        signerUserId: userId,
        signatureData,
        signatureMethod: 'HMAC-SHA256',
        reason: signatureDto.reason,
        meaning: signatureDto.action,
        ipAddress: signatureDto.ipAddress,
        certificateId: certificate.id
      });

      const savedSignature = await this.signatureRepository.save(signature);
      this.logger.log(`Electronic signature created: ${savedSignature.id}`);
      return savedSignature;
    } catch (error) {
      this.logger.error(`Failed to create electronic signature: ${error.message}`);
      throw error;
    }
  }

 async getAuditTrail(query: AuditQuery = {}): Promise<{ entries: AuditTrail[], total: number }> {
  try {
    // Максимально простой запрос без joins
    const entries = await this.auditTrailRepository.find({
      order: { timestamp: 'DESC' },
      take: 50
    });
    
    console.log('Found entries:', entries.length); // Отладка
    
    return { 
      entries: entries || [], 
      total: entries?.length || 0 
    };
  } catch (error) {
    console.error('AuditService error:', error);
    this.logger.error(`Error in getAuditTrail: ${error.message}`);
    return { entries: [], total: 0 };
  }
}

  private async getUserCertificate(userId: string): Promise<UserCertificate | null> {
    return this.certificateRepository.findOne({
      where: { 
        userId, 
        status: 'active',
        expiresAt: MoreThan(new Date()) 
      }
    });
  }

  private computeAuditHash(data: any): string {
    const hashInput = [
      data.userId || '',
      data.actionType || '',
      data.tableName || '',
      data.recordId || '',
      JSON.stringify(data.oldValues) || '',
      JSON.stringify(data.newValues) || '',
      data.timestamp?.toISOString() || '',
      data.previousHash || ''
    ].join('|');

    return crypto.createHash('sha256').update(hashInput).digest('hex');
  }

  private createHMACSignature(data: ElectronicSignatureDto, signingKey: string): string {
    const signatureInput = [
      data.signedBy,
      data.role,
      data.action,
      data.reason,
      data.timestamp,
      data.ipAddress,
      data.context || ''
    ].join('|');

    return crypto.createHmac('sha256', signingKey).update(signatureInput).digest('hex');
  }

  private async decryptUserSigningKey(certificate: UserCertificate, password: string): Promise<string> {
    // Simplified decryption - in production use proper key management
    return 'demo-signing-key-' + certificate.userId;
  }
}
