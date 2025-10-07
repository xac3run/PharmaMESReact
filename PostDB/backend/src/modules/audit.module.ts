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
