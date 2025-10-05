// src/api/client.js
//const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
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
    return this.request('/formulas', {
      method: 'POST',
      body: formulaData,
    });
  }

  async updateFormula(id, formulaData) {
    return this.request(`/formulas/${id}`, {
      method: 'PATCH',
      body: formulaData,
    });
  }

  async updateFormulaStatus(id, status) {
    return this.request(`/formulas/${id}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }

  async deleteFormula(id) {
    return this.request(`/formulas/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials methods
  async getMaterials() {
   return this.request('/formulas/materials');
   //return this.request('/materials');  // ✅ правильный эндпоинт
  }

  async createMaterial(materialData) {
  return this.request('/materials', {
    method: 'POST',
    body: materialData,
  });
}

async updateMaterial(id, materialData) {
  return this.request(`/materials/${id}`, {
    method: 'PATCH',
    body: materialData,
  });
}

async deleteMaterial(id) {
  return this.request(`/materials/${id}`, {
    method: 'DELETE',
  });

}
}
export const apiClient = new ApiClient();
