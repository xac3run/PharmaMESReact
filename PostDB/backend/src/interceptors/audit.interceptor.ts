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
