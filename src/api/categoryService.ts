import api from '@/api/api';
import { AxiosError } from 'axios';

class CategoryService {
  async getAllCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCategoryById(id: number) {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createCategory(data: any) {
    try {
      const response = await api.post('/categories', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateCategory(id: number, data: any) {
    try {
      const response = await api.put(`/categories/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteCategory(id: number) {
    try {
      await api.delete(`/categories/${id}`);
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

export default new CategoryService();