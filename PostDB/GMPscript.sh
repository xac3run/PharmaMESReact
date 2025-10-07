#!/bin/bash

# Setup Audit System Backend Files
# Запуск: chmod +x setup_audit_backend.sh && ./setup_audit_backend.sh

set -e

echo "🚀 Setting up GMP Audit System Backend..."

# Определяем путь к backend
BACKEND_PATH="/home/haspotc/nobilis-mes/PostDB/backend"
cd "$BACKEND_PATH"

echo "📁 Creating directory structure..."
mkdir -p src/entities
mkdir -p src/services
mkdir -p src/controllers
mkdir -p src/interceptors
mkdir -p src/modules

echo "🗄️ Creating Entity files..."

# 3.2.1 - AuditTrail Entity
cat > src/entities/audit-trail.entity.ts << 'EOF'
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
EOF

# 3.2.2 - ElectronicSignature Entity
cat > src/entities/electronic-signature.entity.ts << 'EOF'
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
EOF

# 3.2.3 - UserCertificate Entity
cat > src/entities/user-certificate.entity.ts << 'EOF'
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/users.entity';

@Entity('user_certificates')
export class UserCertificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'certificate_data' })
  certificateData: string;

  @Column({ name: 'private_key_encrypted' })
  privateKeyEncrypted: string;

  @Column({ name: 'key_algorithm', default: 'HMAC-SHA256' })
  keyAlgorithm: string;

  @Column({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date;

  @Column({ default: 'active' })
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
EOF

echo "⚙️ Creating Service files..."

# 3.4 - AuditService
cat > src/services/audit.service.ts << 'EOF'
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

  async getAuditTrail(query: AuditQuery): Promise<{ entries: AuditTrail[], total: number }> {
    const queryBuilder = this.auditTrailRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .leftJoinAndSelect('audit.signatures', 'signatures');

    if (query.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: query.userId });
    }

    if (query.actionType) {
      queryBuilder.andWhere('audit.actionType = :actionType', { actionType: query.actionType });
    }

    if (query.tableName) {
      queryBuilder.andWhere('audit.tableName = :tableName', { tableName: query.tableName });
    }

    if (query.recordId) {
      queryBuilder.andWhere('audit.recordId = :recordId', { recordId: query.recordId });
    }

    queryBuilder.orderBy('audit.sequenceNumber', 'DESC');

    const total = await queryBuilder.getCount();

    if (query.limit) {
      queryBuilder.limit(query.limit);
    }

    if (query.offset) {
      queryBuilder.offset(query.offset);
    }

    const entries = await queryBuilder.getMany();
    return { entries, total };
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
EOF

# 3.5 - AuditController
cat > src/controllers/audit.controller.ts << 'EOF'
import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Query, 
  Param, 
  Request, 
  UseGuards,
  BadRequestException,
  UnauthorizedException,
  Logger
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuditService, CreateAuditEntryDto, ElectronicSignatureDto, AuditQuery } from '../services/audit.service';

@Controller('audit')
@UseGuards(JwtAuthGuard)
export class AuditController {
  private readonly logger = new Logger(AuditController.name);

  constructor(private readonly auditService: AuditService) {}

  @Post('entries')
  async createAuditEntry(@Body() createAuditDto: CreateAuditEntryDto, @Request() req) {
    try {
      const auditData = {
        ...createAuditDto,
        userId: req.user.id,
        sessionId: req.sessionID,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      };

      const auditEntry = await this.auditService.createAuditEntry(auditData);
      
      return {
        success: true,
        auditId: auditEntry.id,
        message: 'Audit entry created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create audit entry: ${error.message}`);
      throw new BadRequestException('Failed to create audit entry');
    }
  }

  @Post('signatures')
  async createElectronicSignature(
    @Body() signatureRequest: {
      auditTrailId?: string;
      action: string;
      reason: string;
      context?: string;
      password: string;
      tableName?: string;
      recordId?: string;
    },
    @Request() req
  ) {
    try {
      let auditTrailId = signatureRequest.auditTrailId;
      
      if (!auditTrailId) {
        const auditEntry = await this.auditService.createAuditEntry({
          userId: req.user.id,
          sessionId: req.sessionID,
          actionType: signatureRequest.action,
          tableName: signatureRequest.tableName,
          recordId: signatureRequest.recordId,
          reason: signatureRequest.reason,
          ipAddress: req.ip,
          userAgent: req.get('user-agent')
        });
        auditTrailId = auditEntry.id;
      }

      const signatureDto: ElectronicSignatureDto = {
        signedBy: req.user.username,
        role: req.user.role,
        action: signatureRequest.action,
        reason: signatureRequest.reason,
        timestamp: new Date().toISOString(),
        ipAddress: req.ip,
        method: 'HMAC-SHA256',
        context: signatureRequest.context
      };

      const signature = await this.auditService.createElectronicSignature(
        auditTrailId,
        signatureDto,
        req.user.id,
        signatureRequest.password
      );

      return {
        success: true,
        signatureId: signature.id,
        auditTrailId: auditTrailId,
        timestamp: signature.signedAt,
        message: 'Electronic signature created successfully'
      };
    } catch (error) {
      this.logger.error(`Failed to create electronic signature: ${error.message}`);
      throw new BadRequestException('Failed to create electronic signature');
    }
  }

  @Get('trail')
  async getAuditTrail(@Query() query: AuditQuery) {
    try {
      const result = await this.auditService.getAuditTrail(query);
      
      return {
        success: true,
        data: result.entries,
        total: result.total,
        query: query
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve audit trail: ${error.message}`);
      throw new BadRequestException('Failed to retrieve audit trail');
    }
  }

  @Get('trail/:tableName/:recordId')
  async getRecordAuditTrail(
    @Param('tableName') tableName: string,
    @Param('recordId') recordId: string
  ) {
    try {
      const result = await this.auditService.getAuditTrail({ tableName, recordId });
      
      return {
        success: true,
        data: result.entries,
        recordId: recordId,
        tableName: tableName
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve record audit trail: ${error.message}`);
      throw new BadRequestException('Failed to retrieve record audit trail');
    }
  }
}
EOF

# 3.6 - AuditInterceptor
cat > src/interceptors/audit.interceptor.ts << 'EOF'
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../services/audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    
    if (this.shouldSkipAudit(url)) {
      return next.handle();
    }

    const actionType = this.determineActionType(method, url);
    
    return next.handle().pipe(
      tap((response) => {
        this.createAuditEntry(request, actionType, response, null);
      }),
      catchError((error) => {
        this.createAuditEntry(request, actionType + '_FAILED', null, error);
        throw error;
      })
    );
  }

  private shouldSkipAudit(url: string): boolean {
    const skipPatterns = [
      '/audit/trail',
      '/audit/statistics',
      '/health'
    ];
    return skipPatterns.some(pattern => url.includes(pattern));
  }

  private determineActionType(method: string, url: string): string {
    if (url.includes('/formulas')) {
      switch (method) {
        case 'POST': return 'CREATE_FORMULA';
        case 'PUT': case 'PATCH': return 'UPDATE_FORMULA';
        case 'DELETE': return 'DELETE_FORMULA';
        case 'GET': return 'VIEW_FORMULA';
      }
    }
    
    return `${method}_${url.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`;
  }

  private async createAuditEntry(request: any, actionType: string, response: any, error: any): Promise<void> {
    try {
      await this.auditService.createAuditEntry({
        userId: request.user?.id,
        sessionId: request.sessionID,
        actionType,
        tableName: this.extractTableName(request.url),
        recordId: this.extractRecordId(request.params),
        newValues: response ? this.sanitizeResponse(response) : null,
        reason: error ? error.message : undefined,
        ipAddress: request.ip,
        userAgent: request.get('user-agent')
      });
    } catch (auditError) {
      console.error('Failed to create audit entry:', auditError);
    }
  }

  private extractTableName(url: string): string {
    const resourceMap = {
      'formulas': 'formulas',
      'materials': 'materials',
      'users': 'users'
    };
    
    for (const [segment, table] of Object.entries(resourceMap)) {
      if (url.includes(segment)) {
        return table;
      }
    }
    
    return undefined;
  }

  private extractRecordId(params: any): string {
    return params?.id || params?.articleNumber || undefined;
  }

  private sanitizeResponse(response: any): any {
    if (typeof response === 'object' && response !== null) {
      const sanitized = { ...response };
      delete sanitized.password;
      delete sanitized.passwordHash;
      return sanitized;
    }
    return response;
  }
}
EOF

# 3.8 - AuditModule
cat > src/modules/audit.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditController } from '../controllers/audit.controller';
import { AuditService } from '../services/audit.service';
import { AuditTrail } from '../entities/audit-trail.entity';
import { ElectronicSignature } from '../entities/electronic-signature.entity';
import { UserCertificate } from '../entities/user-certificate.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuditTrail, ElectronicSignature, UserCertificate])
  ],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditModule {}
EOF

echo "🔧 Updating existing files..."

# Backup and update app.module.ts
cp src/app.module.ts src/app.module.ts.backup

cat > src/app.module.ts << 'EOF'
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FormulasModule } from './formulas/formulas.module';
import { AuditModule } from './modules/audit.module';
import { AuditInterceptor } from './interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    UsersModule,
    FormulasModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
EOF

# Update users.entity.ts to add audit fields
if [ -f "src/users/users.entity.ts" ]; then
  cp src/users/users.entity.ts src/users/users.entity.ts.backup
  
  # Add import if not exists
  if ! grep -q "failed_login_attempts" src/users/users.entity.ts; then
    cat >> src/users/users.entity.ts << 'EOF'

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'account_locked_until', nullable: true })
  accountLockedUntil: Date;

  @Column({ name: 'password_changed_at', default: () => 'CURRENT_TIMESTAMP' })
  passwordChangedAt: Date;
EOF
  fi
fi

echo "📦 Installing dependencies..."
npm install bcryptjs @types/bcryptjs

echo "🔥 Creating database tables..."
# Create audit tables in database
docker exec -i nobilis_postgres psql -U postgres -d nobilis_mes << 'EOSQL'
-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create audit tables
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL UNIQUE,
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(100),
    record_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    reason TEXT,
    parent_audit_id UUID REFERENCES audit_trail(id),
    data_hash VARCHAR(64) NOT NULL DEFAULT 'temp',
    previous_hash VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS electronic_signatures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_trail_id UUID REFERENCES audit_trail(id),
    signer_user_id UUID REFERENCES users(id),
    signature_data TEXT NOT NULL,
    signature_method VARCHAR(50) DEFAULT 'HMAC-SHA256',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT NOT NULL,
    meaning VARCHAR(100) NOT NULL,
    ip_address INET,
    certificate_id UUID
);

CREATE TABLE IF NOT EXISTS user_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    certificate_data TEXT NOT NULL,
    private_key_encrypted TEXT NOT NULL,
    key_algorithm VARCHAR(50) DEFAULT 'HMAC-SHA256',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    revoked_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_trail_user_id ON audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp);
CREATE INDEX IF NOT EXISTS idx_electronic_signatures_audit_id ON electronic_signatures(audit_trail_id);
CREATE INDEX IF NOT EXISTS idx_user_certificates_user_id ON user_certificates(user_id);
EOSQL

echo "🚀 Restarting backend..."
cd ~/nobilis-mes/PostDB
docker-compose restart backend

echo "✅ Setup completed successfully!"
echo ""
echo "📋 Created files:"
echo "  - src/entities/audit-trail.entity.ts"
echo "  - src/entities/electronic-signature.entity.ts"
echo "  - src/entities/user-certificate.entity.ts"
echo "  - src/services/audit.service.ts"
echo "  - src/controllers/audit.controller.ts"
echo "  - src/interceptors/audit.interceptor.ts"
echo "  - src/modules/audit.module.ts"
echo "  - Updated src/app.module.ts"
echo ""
echo "🔍 Check backend status:"
echo "  docker logs nobilis_backend --tail=10"
echo ""
echo "🗄️ Verify database tables:"
echo "  docker exec -it nobilis_postgres psql -U postgres -d nobilis_mes -c '\\dt'"
echo ""
echo "🎉 GMP Audit System Backend is ready!"