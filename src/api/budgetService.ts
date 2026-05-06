import api from '@/api/api';
import { AxiosError } from 'axios';

class BudgetService {
  
  async getAllBudgets() {
    try {
      const response = await api.get('/budgets');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBudgetById(id: number) {
    try {
      const response = await api.get(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserBudgets(userId: number) {
    try {
      const response = await api.get(`/budgets/user/${userId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserBudgetsForMonth(userId: number, month: number, year: number) {
    try {
      const response = await api.get(`/budgets/user/${userId}/month/${month}/year/${year}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserBudgetSummary(userId: number) {
  try {
    const response = await api.get(`/budgets/user/${userId}/summary`);
    return response.data;
  } catch (error) {
    throw this.handleError(error);
  }
}

async getUserBudgetSummaryForMonth(userId: number, month: number, year: number) {
  try {
    const response = await api.get(`/budgets/user/${userId}/month/${month}/year/${year}/summary`);
    return response.data;
  } catch (error) {
    throw this.handleError(error);
  }
}

  async createBudget(data: any) {
    try {
      const response = await api.post('/budgets', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateBudget(id: number, data: any) {
    try {
      const response = await api.put(`/budgets/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteBudget(id: number) {
    try {
      await api.delete(`/budgets/${id}`);
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

export default new BudgetService();