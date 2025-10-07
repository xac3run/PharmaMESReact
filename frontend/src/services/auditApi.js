import { apiClient } from '../api/client';

class AuditApiService {
  async getAuditTrail(query = {}) {
    const params = new URLSearchParams(query);
    return apiClient.request(`/audit/trail?${params}`);
  }

  async createElectronicSignature(signatureData) {
    return apiClient.request('/audit/signatures', {
      method: 'POST',
      body: signatureData,
    });
  }
}

export const auditApi = new AuditApiService();
