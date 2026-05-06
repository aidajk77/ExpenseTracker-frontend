import api from '@/api/api';
import { AxiosError } from 'axios';

class CurrencyService {
  
  async getAllCurrencies() {
    try {
      const response = await api.get('/currencies');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrencyById(id: number) {
    try {
      const response = await api.get(`/currencies/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCurrency(data: any) {
    try {
      const response = await api.post('/currencies', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCurrency(id: number, data: any) {
    try {
      const response = await api.put(`/currencies/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCurrency(id: number) {
    try {
      await api.delete(`/currencies/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (error instanceof AxiosError) {
      const message = error.response?.data?.detail || error.message || 'An error occurred';
      return new Error(message);
    }
    return new Error('An unexpected error occurred');
  }
}

export default new CurrencyService();