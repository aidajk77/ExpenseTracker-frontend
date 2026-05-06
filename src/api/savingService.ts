import api from '@/api/api';
import { AxiosError } from 'axios';

class SavingService {
  
  async getAllSavings() {
    try {
      const response = await api.get('/savings');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllUserSavings(userId: number) {
    try {
      const response = await api.get(`/savings/user/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserNonCompletedSavings(userId: number) {
    try {
      const response = await api.get(`/Savings/user/${userId}/non-completed`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSavingById(id: number) {
    try {
      const response = await api.get(`/savings/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createSaving(data: any) {
    try {
      const response = await api.post('/savings', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateSaving(id: number, data: any) {
    try {
      const response = await api.put(`/savings/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async joinSaving(userId: number, savingId: number, data: any) {
    try {
      const response = await api.post(`/users/${userId}/savings`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteSaving(id: number) {
    try {
      await api.delete(`/savings/${id}`);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async removeSavingFromUser(userId: number, savingId: number) {
    try {
      await api.delete(`/users/${userId}/savings/${savingId}`);
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

export default new SavingService();