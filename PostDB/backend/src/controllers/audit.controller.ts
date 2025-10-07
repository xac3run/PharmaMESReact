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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
