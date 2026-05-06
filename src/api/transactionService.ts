import api from '@/api/api';
import { AxiosError } from 'axios';


export const getTransactionTypeLabel = (type: number | string): string => {
  const typeMap: Record<string | number, string> = {
    0: 'Income',
    1: 'Expense',
    2: 'Saving',
    'Income': 'Income',
    'Expense': 'Expense',
    'Saving': 'Saving',
  };

  return typeMap[type] || 'Unknown';
};

class TransactionService {
  
  async getPaginatedTransactions(page: number = 1, limit: number = 10) {
    try {
      const response = await api.get('/transactions', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserTransactionsPaginatedWithFilters(
    userId: number,
    page: number = 1,
    limit: number = 10,
    filters: {
      type?: string;
      categoryId?: string;
      savingId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const params = { page, limit, ...filters };
      const response = await api.get(`/transactions/user/${userId}/paginated`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getTransactionById(id: number) {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAllUserTransactions(userId: number) {
    try {
      const response = await api.get(`/transactions/user/${userId}/all`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserMonthlyIncome(userId: number, month: number, year: number) {
    try {
      const response = await api.get(`/transactions/user/${userId}/income/monthly`, { 
        params: { month, year } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserIncomeByDateRange(userId: number, startDate: string, endDate: string) {
    try {
      const response = await api.get(`/transactions/user/${userId}/income/range`, { 
        params: { startDate, endDate } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserMonthlyExpense(userId: number, month: number, year: number) {
    try {
      const response = await api.get(`/transactions/user/${userId}/expense/monthly`, { 
        params: { month, year } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

   async getUserExpensesByDateRange(userId: number, startDate: string, endDate: string) {
    try {
      const response = await api.get(`/transactions/user/${userId}/expense/range`, { 
        params: { startDate, endDate } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  async getUserMonthlySavings(userId: number, month: number, year: number) {
    try {
      const response = await api.get(`/transactions/user/${userId}/savings/monthly`, { 
        params: { month, year } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getUserSavingsByDateRange(userId: number, startDate: string, endDate: string) {
    try {
      const response = await api.get(`/transactions/user/${userId}/savings/range`, { 
        params: { startDate, endDate } 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createTransaction(data: any) {
    try {
      const response = await api.post('/transactions', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateTransaction(id: number, data: any) {
    try {
      const response = await api.put(`/transactions/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async deleteTransaction(id: number) {
    try {
      await api.delete(`/transactions/${id}`);
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

export default new TransactionService();