import api from '@/api/api';
import { AxiosError } from 'axios';

class PaymentMethodService {
  
  async getAllPaymentMethods() {
    try {
      const response = await api.get('/paymentmethods');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPaymentMethodById(id: number) {
    try {
      const response = await api.get(`/paymentmethods/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createPaymentMethod(data: any) {
    try {
      const response = await api.post('/paymentmethods', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePaymentMethod(id: number, data: any) {
    try {
      const response = await api.put(`/paymentmethods/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deletePaymentMethod(id: number) {
    try {
      await api.delete(`/paymentmethods/${id}`);
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

export default new PaymentMethodService();