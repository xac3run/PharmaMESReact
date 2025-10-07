import { useState } from 'react';
import { auditApi } from '../services/auditApi';

export const useAudit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSignature = async (signatureData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await auditApi.createElectronicSignature(signatureData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, createSignature, auditApi };
};
