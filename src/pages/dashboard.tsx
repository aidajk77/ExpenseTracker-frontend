import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar } from 'react-chartjs-2';
import { useEffect, useState } from 'react';
import transactionService, { getTransactionTypeLabel } from '@/api/transactionService';
import categoryService from '@/api/categoryService';
import userService from "@/api/userService";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import savingService from "@/api/savingService";
import { useCurrency } from '@/hooks/useCurrency';
import type { ChartOptions } from 'chart.js';

function Dashboard() {
  const navigate = useNavigate();
  const { userCurrencySymbol, formatAmount: formatCurrencyAmount } = useCurrency(); // ✅ Use currency context

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);
  const [monthlyIncome, setMonthlyIncome] = useState<number>(0);
  const [monthlyExpense, setMonthlyExpense] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  const [savingsCount, setSavingsCount] = useState<number>(0);
  
  // States for graph data
  const [monthlyIncomeData, setMonthlyIncomeData] = useState<number[]>([]);
  const [monthlyExpenseData, setMonthlyExpenseData] = useState<number[]>([]);
  const [monthlySavingsData, setMonthlySavingsData] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch current user
        const currentUser = await userService.getCurrentUser();
        setCurrentUser(currentUser);

        // Get current month and year
        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        // Fetch monthly income for current month
        const incomeData = await transactionService.getUserMonthlyIncome(
          currentUser.id,
          currentMonth,
          currentYear
        );
        setMonthlyIncome(incomeData.monthlyIncome);

        // Fetch monthly expense for current month
        const expenseData = await transactionService.getUserMonthlyExpense(
          currentUser.id,
          currentMonth,
          currentYear
        );
        setMonthlyExpense(expenseData.monthlyExpense);

        // Fetch monthly savings for current month using transactionService
        const savingsData = await transactionService.getUserMonthlySavings(
          currentUser.id,
          currentMonth,
          currentYear
        );
        setTotalSavings(savingsData.monthlySavings);

        // Fetch all transactions
        const allTransactionsData = await transactionService.getAllUserTransactions(currentUser.id);
        setAllTransactions(allTransactionsData);

        // Calculate data for last 6 months
        const incomeValues: number[] = [];
        const expenseValues: number[] = [];
        const savingsValues: number[] = [];

        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentYear, currentMonth - 1 - i, 1);
          const month = monthDate.getMonth() + 1;
          const year = monthDate.getFullYear();

          // Fetch monthly income
          const monthIncome = await transactionService.getUserMonthlyIncome(
            currentUser.id,
            month,
            year
          );
          incomeValues.push(monthIncome.monthlyIncome || 0);

          // Fetch monthly expense
          const monthExpense = await transactionService.getUserMonthlyExpense(
            currentUser.id,
            month,
            year
          );
          expenseValues.push(monthExpense.monthlyExpense || 0);

          // Fetch monthly savings using transactionService
          const monthSavings = await transactionService.getUserMonthlySavings(
            currentUser.id,
            month,
            year
          );
          savingsValues.push(monthSavings.monthlySavings || 0);
        }

        setMonthlyIncomeData(incomeValues);
        setMonthlyExpenseData(expenseValues);
        setMonthlySavingsData(savingsValues);

        // Count savings transactions for current month
        const savingsCount = allTransactionsData.filter((t: any) => 
          getTransactionTypeLabel(t.type) === 'Saving' &&
          new Date(t.date).getMonth() + 1 === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        ).length;
        setSavingsCount(savingsCount);

        // Fetch paginated transactions for recent transactions table
        const response = await transactionService.getUserTransactionsPaginatedWithFilters(
          currentUser.id,
          1,
          10
        );
        
        const firstFourTransactions = response.data.slice(0, 4);

        // Enrich transactions with category OR saving data based on what exists
        const enrichedTransactions = await Promise.all(
          firstFourTransactions.map(async (transaction: any) => {
            // Check if transaction has categoryId
            if (transaction.categoryId && transaction.categoryId > 0) {
              const category = await categoryService.getCategoryById(transaction.categoryId);
              return {
                ...transaction,
                category,
                entity: 'category',
              };
            }
            // Check if transaction has savingId
            else if (transaction.savingId && transaction.savingId > 0) {
              const saving = await savingService.getSavingById(transaction.savingId);
              return {
                ...transaction,
                saving,
                entity: 'saving',
              };
            }
            // Fallback if neither exists
            else {
              return {
                ...transaction,
                entity: 'none',
              };
            }
          })
        );
        
        setTransactions(enrichedTransactions);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getEntityName = (transaction: any) => {
    if (transaction.entity === 'category' && transaction.category) {
      return transaction.category.name || 'Uncategorized';
    } else if (transaction.entity === 'saving' && transaction.saving) {
      return transaction.saving.name || 'Saving Goal';
    }
    return 'Uncategorized';
  };

  // Get month labels for last 6 months
  const getLastSixMonths = () => {
    const now = new Date();
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(monthNames[monthDate.getMonth()]);
    }
    return months;
  };

  const monthLabels = getLastSixMonths();

  const chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  // Data for expenses
  const expensesData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Expenses',
        data: monthlyExpenseData,
        backgroundColor: '#ef4444',
      },
    ],
  };

  // Data for income
  const incomeData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Income',
        data: monthlyIncomeData,
        backgroundColor: '#10b981',
      },
    ],
  };

  // Data for savings
  const savingsData = {
    labels: monthLabels,
    datasets: [
      {
        label: 'Savings',
        data: monthlySavingsData,
        backgroundColor: '#3b82f6',
      },
    ],
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
  };

  // Get current month transaction counts
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const incomeCount = allTransactions.filter((t: any) => 
    getTransactionTypeLabel(t.type) === 'Income' &&
    new Date(t.date).getMonth() + 1 === currentMonth &&
    new Date(t.date).getFullYear() === currentYear
  ).length;

  const expenseCount = allTransactions.filter((t: any) => 
    getTransactionTypeLabel(t.type) === 'Expense' &&
    new Date(t.date).getMonth() + 1 === currentMonth &&
    new Date(t.date).getFullYear() === currentYear
  ).length;

  return (
    <div>
      <main className='p-6'>
        {/* Stats Cards */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8'>
          
          {/* Total Income */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Income</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-green-600'>{formatCurrencyAmount(monthlyIncome)}</p>
              <p className='text-xs text-muted-foreground mt-2'>{incomeCount} transactions</p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Expenses</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-red-600'>{formatCurrencyAmount(Math.abs(monthlyExpense))}</p>
              <p className='text-xs text-muted-foreground mt-2'>{expenseCount} transactions</p>
            </CardContent>
          </Card>

          {/* Total Savings */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Savings</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-blue-600'>{formatCurrencyAmount(totalSavings)}</p>
              <p className='text-xs text-muted-foreground mt-2'>{savingsCount} transactions</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className='mb-8'>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <div>
                <CardTitle>Recent Transactions</CardTitle>
              </div>
              <Button 
                variant='outline' 
                size='sm'
                onClick={() => navigate('/transactions')}
              >
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && <p className='text-muted-foreground'>Loading transactions...</p>}
            {error && <p className='text-red-600'>Error: {error}</p>}
            {!loading && transactions.length === 0 && (
              <p className='text-muted-foreground'>No transactions found</p>
            )}
            {!loading && transactions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className='font-medium text-left'>{getEntityName(transaction)}</TableCell>
                      <TableCell className='font-medium text-left'>
                        <span className={
                          getTransactionTypeLabel(transaction.type) === 'Income' 
                            ? 'text-green-600' 
                            : getTransactionTypeLabel(transaction.type) === 'Saving'
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </TableCell>
                      <TableCell className='font-medium text-left'>{formatDate(transaction.date)}</TableCell>
                      <TableCell className='text-right font-semibold'>
                        <span className={
                          getTransactionTypeLabel(transaction.type) === 'Income' 
                            ? 'text-green-600' 
                            : getTransactionTypeLabel(transaction.type) === 'Saving'
                            ? 'text-blue-600'
                            : 'text-red-600'
                        }>
                          {getTransactionTypeLabel(transaction.type) === 'Income' 
                            ? '+' 
                            : getTransactionTypeLabel(transaction.type) === 'Saving'
                            ? '-'
                            : '-'}
                          {formatCurrencyAmount(Math.abs(transaction.amount))}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Charts Row - Responsive Grid */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8'>
          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Monthly Spending</CardTitle>
              <CardDescription className='text-xs'>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent className='h-48 sm:h-56 md:h-64'>
              <Bar data={expensesData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Monthly Savings</CardTitle>
              <CardDescription className='text-xs'>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent className='h-48 sm:h-56 md:h-64'>
              <Bar data={savingsData} options={chartOptions} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='text-base'>Monthly Income</CardTitle>
              <CardDescription className='text-xs'>Last 6 months</CardDescription>
            </CardHeader>
            <CardContent className='h-48 sm:h-56 md:h-64'>
              <Bar data={incomeData} options={chartOptions} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export default Dashboard;