// src/api/client.js
const API_BASE_URL = 'http://77.233.212.181:3001/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(username, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: { username, password },
    });
    this.setToken(data.access_token);
    return data;
  }

  async logout() {
    this.removeToken();
  }

  // Formulas methods
  async getFormulas() {
    return this.request('/formulas');
  }

  async getFormula(id) {
    return this.request(`/formulas/${id}`);
  }

  async createFormula(formulaData) {
    const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
    // Преобразуем данные для создания формулы
    const transformedData = {
      articleNumber: formulaData.articleNumber,
      productName: formulaData.productName,
      weightPerUnit: parseFloat(formulaData.weightPerUnit) || 0,
      productType: formulaData.productType || 'dosing',
      status: formulaData.status || 'draft',
      version: formulaData.version || '1.0',
      bom: formulaData.bom?.map(item => ({
        materialArticle: item.materialArticle,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'mg',
        minQuantity: parseFloat(item.minQuantity) || 0,
        maxQuantity: parseFloat(item.maxQuantity) || 0,
        materialType: item.materialType || 'raw_material'
      })) || []
    };

    console.log('Creating formula with data:', transformedData);
    return this.request('/formulas', {
      method: 'POST',
      body: transformedData,
    });
  }

  async updateFormula(id, formulaData) {
    const toNumber = (value) => {
    if (value === '' || value === null || value === undefined) return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };
    // Преобразуем данные для обновления формулы
    const transformedData = {
      articleNumber: formulaData.articleNumber,
      productName: formulaData.productName,
      weightPerUnit: parseFloat(formulaData.weightPerUnit) || 0,
      productType: formulaData.productType,
      status: formulaData.status,
      version: formulaData.version,
      bom: formulaData.bom?.map(item => ({
        materialArticle: item.materialArticle,
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || 'mg',
        minQuantity: parseFloat(item.minQuantity) || 0,
        maxQuantity: parseFloat(item.maxQuantity) || 0,
        materialType: item.materialType || 'raw_material'
      })) || []
    };
    
    console.log('Transformed data types:', {
    weightPerUnit: typeof transformedData.weightPerUnit,
    bomItem: transformedData.bom[0] ? {
      quantity: typeof transformedData.bom[0].quantity,
      minQuantity: typeof transformedData.bom[0].minQuantity,
      maxQuantity: typeof transformedData.bom[0].maxQuantity
    } : 'no bom items'
  });
    return this.request(`/formulas/${id}`, {
      method: 'PATCH',
      body: transformedData,
    });
  }

  async updateFormulaStatus(id, status) {
    console.log('Updating formula status:', { id, status });
    return this.request(`/formulas/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }

  async deleteFormula(id) {
    console.log('Deleting formula:', id);
    return this.request(`/formulas/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials methods
  async getMaterials() {
    return this.request('/formulas/materials');
  }

  async createMaterial(materialData) {
    // Преобразуем данные для создания материала
    const transformedData = {
      articleNumber: materialData.articleNumber,
      name: materialData.name,
      status: materialData.status || 'quarantine',
      quantity: parseFloat(materialData.quantity) || 0,
      unit: materialData.unit || 'g',
      location: materialData.location,
      expiryDate: materialData.expiryDate,
      receivedDate: materialData.receivedDate,
      supplier: materialData.supplier,
      lotNumber: materialData.lotNumber
    };

    console.log('Creating material with data:', transformedData);
    return this.request('/materials', {
      method: 'POST',
      body: transformedData,
    });
  }

  async updateMaterial(id, materialData) {
    // Преобразуем данные для обновления материала
    const transformedData = {
      articleNumber: materialData.articleNumber,
      name: materialData.name,
      status: materialData.status,
      quantity: parseFloat(materialData.quantity) || 0,
      unit: materialData.unit,
      location: materialData.location,
      expiryDate: materialData.expiryDate,
      receivedDate: materialData.receivedDate,
      supplier: materialData.supplier,
      lotNumber: materialData.lotNumber
    };

    console.log('Updating material with data:', transformedData);
    return this.request(`/materials/${id}`, {
      method: 'PATCH',
      body: transformedData,
    });
  }

  async deleteMaterial(id) {
    console.log('Deleting material:', id);
    return this.request(`/materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Helper method for error handling
  handleApiError(error, action = 'API request') {
    console.error(`${action} failed:`, error);
    
    if (error.message.includes('401')) {
      // Unauthorized - token might be expired
      this.removeToken();
      throw new Error('Session expired. Please log in again.');
    }
    
    if (error.message.includes('400')) {
      throw new Error('Invalid data provided. Please check your input.');
    }
    
    if (error.message.includes('403')) {
      throw new Error('Access denied. You don\'t have permission for this action.');
    }
    
    if (error.message.includes('404')) {
      throw new Error('Resource not found.');
    }
    
    if (error.message.includes('500')) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
}

export const apiClient = new ApiClient();