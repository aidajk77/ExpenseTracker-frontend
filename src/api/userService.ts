import api from '@/api/api';
import { AxiosError } from 'axios';

class UserService {
  async getAllUsers() {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCurrentUser() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserById(id: number) {
    try {
      const response = await api.get(`/users/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async register(data: any) {
    try {
      const response = await api.post('/users/register', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(data: any) {
    try {
      const response = await api.post('/users/login', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    try {
      const response = await api.post('/users/change-password', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUser(id: number, data: any) {
    try {
      const response = await api.put(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteUser(id: number) {
    try {
      await api.delete(`/users/${id}`);
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

export default new UserService();