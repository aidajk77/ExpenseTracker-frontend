import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import transactionService, { getTransactionTypeLabel } from '@/api/transactionService';
import categoryService from '@/api/categoryService';
import userService from "@/api/userService";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import savingService from '@/api/savingService';
import paymentMethodService from '@/api/paymentMethodService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { X, ChevronDown, Trash2, Calendar as CalendarIcon, Clock, Clock8Icon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  const {userCurrencySymbol, formatAmount: formatCurrencyAmount} = useCurrency(); 
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [totalSavings, setTotalSavings] = useState<number>(0);
  
  const [incomeCount, setIncomeCount] = useState<number>(0);
  const [expenseCount, setExpenseCount] = useState<number>(0);
  const [savingCount, setSavingCount] = useState<number>(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  
  const [filters, setFilters] = useState({
    type: 'all',
    categoryId: 'all',
    savingId: 'all',
    startDate: '',
    endDate: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  
  // State for filter calendar pickers
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  const [selectedSavingRemaining, setSelectedSavingRemaining] = useState<number>(0);
  const [amountWarning, setAmountWarning] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    categoryId: '',
    savingId: '',
    type: '',
    paymentMethodId: '',
    date: new Date().toISOString().split('T')[0],
    time: '00:00',
    description: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [dateOpen, setDateOpen] = useState(false);
  
  const itemsPerPage = 10;

  //  Fetch transactions with filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const currentUser = await userService.getCurrentUser();
        setCurrentUser(currentUser);

        const apiFilters: any = {};
        if (filters.type && filters.type !== 'all') apiFilters.type = filters.type;
        if (filters.categoryId && filters.categoryId !== 'all') apiFilters.categoryId = filters.categoryId;
        if (filters.savingId && filters.savingId !== 'all') apiFilters.savingId = filters.savingId;
        if (filters.startDate) apiFilters.startDate = filters.startDate;
        if (filters.endDate) apiFilters.endDate = filters.endDate;

        const response = await transactionService.getUserTransactionsPaginatedWithFilters(
          currentUser.id,
          currentPage,
          itemsPerPage,
          apiFilters
        );

        const enrichedTransactions = await Promise.all(
          response.data.map(async (transaction: any) => {
            if (transaction.categoryId && transaction.categoryId > 0) {
              const category = await categoryService.getCategoryById(transaction.categoryId);
              return {
                ...transaction,
                category,
                entity: 'category',
              };
            }
            else if (transaction.savingId && transaction.savingId > 0) {
              const saving = await savingService.getSavingById(transaction.savingId);
              return {
                ...transaction,
                saving,
                entity: 'saving',
              };
            }
            else {
              return {
                ...transaction,
                entity: 'none',
              };
            }
          })
        );

        setTransactions(enrichedTransactions);
        setTotalPages(response.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, filters]);

  // Fetch filter options when modal opens
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        if (currentUser?.id) {
          const allCategories = await categoryService.getAllCategories();
          setCategories(allCategories);
          
          const allSavings = await savingService.getAllUserSavings(currentUser.id);
          setSavings(allSavings);
          
          if (isModalOpen) {
            const allPaymentMethods = await paymentMethodService.getAllPaymentMethods();
            setPaymentMethods(allPaymentMethods);
          }
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err);
      }
    };

    fetchFilterOptions();
  }, [currentUser?.id, isModalOpen]);

  useEffect(() => {
    const fetchAllTimeTotals = async () => {
      try {
        const currentUser = await userService.getCurrentUser();
        
        const startDate = '1900-01-01';
        const today = new Date().toISOString().split('T')[0];

        const incomeData = await transactionService.getUserIncomeByDateRange(
          currentUser.id,
          startDate,
          today
        );
        setTotalIncome(incomeData.income || 0);

        const expenseData = await transactionService.getUserExpensesByDateRange(
          currentUser.id,
          startDate,
          today
        );
        setTotalExpenses(expenseData.expenses || 0);

        const savingsData = await transactionService.getUserSavingsByDateRange(
          currentUser.id,
          startDate,
          today
        );
        setTotalSavings(savingsData.savings || 0);

        const allTransactionsData = await transactionService.getAllUserTransactions(currentUser.id);
        
        setIncomeCount(allTransactionsData.filter((t: any) => getTransactionTypeLabel(t.type) === 'Income').length);
        setExpenseCount(allTransactionsData.filter((t: any) => getTransactionTypeLabel(t.type) === 'Expense').length);
        setSavingCount(allTransactionsData.filter((t: any) => getTransactionTypeLabel(t.type) === 'Saving').length);
      } catch (err) {
        console.error('Failed to fetch all-time totals:', err);
      }
    };

    fetchAllTimeTotals();
  }, []);

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1);
  };

  // Handle start date selection from filter calendar
  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      handleFilterChange('startDate', format(date, 'yyyy-MM-dd'));
      setStartDateOpen(false);
    }
  };

  // Handle end date selection from filter calendar
  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      handleFilterChange('endDate', format(date, 'yyyy-MM-dd'));
      setEndDateOpen(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      type: 'all',
      categoryId: 'all',
      savingId: 'all',
      startDate: '',
      endDate: ''
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = filters.type !== 'all' || 
                          filters.categoryId !== 'all' || 
                          filters.savingId !== 'all' || 
                          filters.startDate !== '' || 
                          filters.endDate !== '';

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value);
    
    if (formData.type === '2' && formData.savingId) {
      if (numValue > selectedSavingRemaining) {
        setFormData(prev => ({
          ...prev,
          amount: selectedSavingRemaining.toString()
        }));
        setAmountWarning(`Amount limited to $${selectedSavingRemaining.toFixed(2)} (remaining in goal)`);
        
        setTimeout(() => setAmountWarning(null), 3000);
      } else {
        setFormData(prev => ({
          ...prev,
          amount: value
        }));
        setAmountWarning(null);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        amount: value
      }));
      setAmountWarning(null);
    }
  };

  const handleSavingSelect = (savingId: string) => {
    setFormData(prev => ({
      ...prev,
      savingId: savingId
    }));

    const selectedSaving = savings.find(s => s.id.toString() === savingId);
    if (selectedSaving) {
      const remaining = selectedSaving.targetAmount - (selectedSaving.currentAmount || 0);
      setSelectedSavingRemaining(Math.max(0, remaining));
      setAmountWarning(null);
      setFormData(prev => ({
        ...prev,
        amount: ''
      }));
    }
  };

  const handleFormChange = (field: string, value: string) => {
    if (field === 'amount') {
      handleAmountChange(value);
    } else if (field === 'savingId') {
      handleSavingSelect(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      if (field === 'type') {
        setFormData(prev => ({
          ...prev,
          categoryId: '',
          savingId: ''
        }));
        setSelectedSavingRemaining(0);
        setAmountWarning(null);
      }
    }
  };

  // Handle date selection from modal calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
      setDateOpen(false);
    }
  };

  const getEntityName = (transaction: any) => {
    if (transaction.entity === 'category' && transaction.category) {
      return transaction.category.name || 'Uncategorized';
    } else if (transaction.entity === 'saving' && transaction.saving) {
      return transaction.saving.name || 'Saving Goal';
    }
    return 'Uncategorized';
  };

  const handleDeleteTransaction = async () => {
    if (deleteId !== null) {
      try {
        setDeleting(true);
        
        await transactionService.deleteTransaction(deleteId);
        
        setTransactions(transactions.filter(t => t.id !== deleteId));
        
        setDeleteId(null);
        setShowDeleteDialog(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete transaction');
        console.error(err);
      } finally {
        setDeleting(false);
      }
    }
  };

  const openDeleteDialog = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const handleSubmitTransaction = async () => {
    try {
      setFormLoading(true);
      setFormError(null);

      if (!formData.amount || !formData.type || !formData.date || !formData.time || !formData.paymentMethodId) {
        setFormError('Please fill in all required fields');
        setFormLoading(false);
        return;
      }

      if ((formData.type === '0' || formData.type === '1') && !formData.categoryId) {
        setFormError('Please select a category');
        setFormLoading(false);
        return;
      }

      if (formData.type === '2' && !formData.savingId) {
        setFormError('Please select a saving goal');
        setFormLoading(false);
        return;
      }

      if (formData.type === '2') {
        const amount = parseFloat(formData.amount);
        if (amount > selectedSavingRemaining) {
          setFormError(`Amount cannot exceed remaining balance of $${selectedSavingRemaining.toFixed(2)}`);
          setFormLoading(false);
          return;
        }
      }

      if (!currentUser?.id) {
        setFormError('User data not loaded. Please refresh the page.');
        setFormLoading(false);
        return;
      }

      const dateTimeString = `${formData.date}T${formData.time}:00`;
      const dateObj = new Date(dateTimeString);
      const isoTimestamp = dateObj.toISOString();
      
      const newTransaction: any = {
        userId: currentUser.id,
        type: parseInt(formData.type),
        amount: parseFloat(formData.amount),
        paymentMethodId: parseInt(formData.paymentMethodId),
        date: isoTimestamp,
        description: formData.description,
      };

      if (formData.type === '0' || formData.type === '1') {
        newTransaction.categoryId = parseInt(formData.categoryId);
      }

      if (formData.type === '2') {
        newTransaction.savingId = parseInt(formData.savingId);
      }

      const createdTransaction = await transactionService.createTransaction(newTransaction);

      let enrichedTransaction: any = {
        ...createdTransaction,
        entity: 'none'
      };

      if (createdTransaction.categoryId && createdTransaction.categoryId > 0) {
        const category = await categoryService.getCategoryById(createdTransaction.categoryId);
        enrichedTransaction = {
          ...enrichedTransaction,
          category,
          entity: 'category'
        };
      } else if (createdTransaction.savingId && createdTransaction.savingId > 0) {
        const saving = await savingService.getSavingById(createdTransaction.savingId);
        enrichedTransaction = {
          ...enrichedTransaction,
          saving,
          entity: 'saving'
        };
      }

      setTransactions([enrichedTransaction, ...transactions]);

      setFormData({
        amount: '',
        categoryId: '',
        savingId: '',
        type: '',
        paymentMethodId: '',
        date: new Date().toISOString().split('T')[0],
        time: '00:00',
        description: ''
      });
      setSelectedSavingRemaining(0);
      setAmountWarning(null);
      setIsModalOpen(false);

      setCurrentPage(1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create transaction');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'});
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const showCategorySelection = formData.type === '0' || formData.type === '1';
  const showSavingSelection = formData.type === '2';

  return (
    <div>
      <main className='p-6'>

        {/* Transaction Stats */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8'>
          {/* Total Income */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Income</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-green-600'>{userCurrencySymbol}{totalIncome.toFixed(2)}</p>
              <p className='text-xs text-muted-foreground mt-2'>
                {incomeCount} transactions
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Expenses</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-red-600'>{userCurrencySymbol}{Math.abs(totalExpenses).toFixed(2)}</p>
              <p className='text-xs text-muted-foreground mt-2'>
                {expenseCount} transactions
              </p>
            </CardContent>
          </Card>

          {/* Total Savings */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Savings</CardTitle>
              <CardDescription>All time</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-blue-600'>{userCurrencySymbol}{totalSavings.toFixed(2)}</p>
              <p className='text-xs text-muted-foreground mt-2'>
                {savingCount} transactions
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Transactions List with Filters Inside */}
        <Card>
            <CardHeader>
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                  <div>
                    <CardTitle>All Transactions</CardTitle>
                    <CardDescription>
                      Page {currentPage} of {totalPages}
                    </CardDescription>
                  </div>
                  <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                    {/* Toggle Filters Button */}
                    <Button 
                      variant='outline'
                      size='sm'
                      onClick={() => setShowFilters(!showFilters)}
                      className='gap-2'
                    >
                      <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                      Filters
                      {hasActiveFilters && (
                        <span className='ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded text-xs font-semibold'>
                          {[filters.type !== 'all', filters.categoryId !== 'all', filters.savingId !== 'all', filters.startDate !== '', filters.endDate !== ''].filter(Boolean).length}
                        </span>
                      )}
                    </Button>
                    <Button className='bg-blue-600 hover:bg-blue-700 w-full sm:w-auto'
                      onClick={() => setIsModalOpen(true)}>Add Transaction</Button>
                  </div>
                </div>

                {/* Collapsible Filters Section */}
                {showFilters && (
                  <div className='mt-6 pt-6 border-t'>
                    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'>
                      {/* Type Filter */}
                      <div className='space-y-2'>
                        <Label htmlFor='filter-type'>Type</Label>
                        <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                          <SelectTrigger id='filter-type'>
                            <SelectValue placeholder='All Types' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All Types</SelectItem>
                            <SelectItem value='0'>Income</SelectItem>
                            <SelectItem value='1'>Expense</SelectItem>
                            <SelectItem value='2'>Saving</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category Filter */}
                      <div className='space-y-2'>
                        <Label htmlFor='filter-category'>Category</Label>
                        <Select value={filters.categoryId} onValueChange={(value) => handleFilterChange('categoryId', value)}>
                          <SelectTrigger id='filter-category'>
                            <SelectValue placeholder='All Categories' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='all'>All Categories</SelectItem>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id.toString()}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Start Date Filter with Calendar */}
                      <div className='space-y-2'>
                        <Label htmlFor='filter-start-date'>From Date</Label>
                        <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.startDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.startDate ? format(new Date(filters.startDate + 'T00:00:00'), "MMM dd, yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.startDate ? new Date(filters.startDate + 'T00:00:00') : undefined}
                              onSelect={handleStartDateSelect}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* End Date Filter with Calendar */}
                      <div className='space-y-2'>
                        <Label htmlFor='filter-end-date'>To Date</Label>
                        <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !filters.endDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {filters.endDate ? format(new Date(filters.endDate + 'T00:00:00'), "MMM dd, yyyy") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={filters.endDate ? new Date(filters.endDate + 'T00:00:00') : undefined}
                              onSelect={handleEndDateSelect}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <div className='mt-4 flex items-center gap-2'>
                        <Button
                          onClick={handleClearFilters}
                          variant='outline'
                          size='sm'
                          className='gap-2'
                        >
                          <X className='w-4 h-4' />
                          Clear All Filters
                        </Button>
                      </div>
                    )}
                  </div>
                )}
          </CardHeader>
          <CardContent>
            {/* Transactions Table */}
            {loading && <p className='text-muted-foreground'>Loading transactions...</p>}
            {error && <p className='text-red-600'>Error: {error}</p>}
            {!loading && transactions.length === 0 && (
              <p className='text-muted-foreground text-center py-8'>
                {hasActiveFilters ? 'No transactions match your filters' : 'No transactions found'}
              </p>
            )}
            {!loading && transactions.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead className='text-right'>Amount</TableHead>
                    <TableHead className='text-center'>Actions</TableHead>
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
                      <TableCell className='font-medium text-left'>{formatTime(transaction.date)}</TableCell>
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
                            : '-'}{userCurrencySymbol}{Math.abs(transaction.amount).toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-2 justify-center'>
                          <Button 
                            onClick={() => openDeleteDialog(transaction.id)} 
                            variant='destructive' 
                            size='sm'
                            className='gap-2'
                            disabled={deleting}
                          >
                            <Trash2 className='w-4 h-4' />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Backend Pagination Controls */}
            {transactions.length > 0 && (
              <div className='flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t'>
                <p className='text-sm text-muted-foreground'>
                  Page {currentPage} of {totalPages}
                </p>
                <div className='flex flex-wrap gap-1 justify-center sm:justify-end'>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant='outline'
                    size='sm'
                  >
                    Prev
                  </Button>
                  <div className='flex gap-1'>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = currentPage > 3 
                        ? currentPage - 2 + i 
                        : i + 1;
                      if (pageNum <= totalPages) {
                        return (
                          <Button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            variant={currentPage === pageNum ? 'default' : 'outline'}
                            size='sm'
                            className='w-8 h-8 p-0'
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant='outline'
                    size='sm'
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transaction? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex gap-2 justify-end'>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTransaction}
              className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Transaction Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Create a new transaction. Fill in all required fields.
            </DialogDescription>
          </DialogHeader>
          
          {formError && (
            <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-4'>
              {formError}
            </div>
          )}

          {amountWarning && (
            <div className='bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded mb-4'>
              {amountWarning}
            </div>
          )}

          <div className='grid gap-4 py-4'>
            {/* Amount */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='amount' className='text-right'>Amount *</Label>
              <div className='col-span-3'>
                <div className='relative'>
                  <Input
                    id='amount'
                    type='number'
                    step='0.01'
                    placeholder='0.00'
                    value={formData.amount}
                    onChange={(e) => handleFormChange('amount', e.target.value)}
                    className='pr-12' // Add padding for currency code
                  />
                  {/* Display currency code */}
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground'>
                    {userCurrencySymbol}
                  </span>
                </div>
                {formData.type === '2' && formData.savingId && (
                  <p className='text-xs text-muted-foreground mt-1'>
                    Max: {formatCurrencyAmount(selectedSavingRemaining)} remaining
                  </p>
                )}
              </div>
            </div>

            {/* Type */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='type' className='text-right'>Type *</Label>
              <Select value={formData.type} onValueChange={(value) => handleFormChange('type', value)}>
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select transaction type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='0'>Income</SelectItem>
                  <SelectItem value='1'>Expense</SelectItem>
                  <SelectItem value='2'>Saving</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection - Only show for Income/Expense */}
            {showCategorySelection && (
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='category' className='text-right'>Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleFormChange('categoryId', value)}>
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Select category' />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Saving Selection - Only show for Saving */}
            {showSavingSelection && (
              <div className='grid grid-cols-4 items-center gap-4'>
                <Label htmlFor='saving' className='text-right'>Saving *</Label>
                <Select value={formData.savingId} onValueChange={(value) => handleFormChange('savingId', value)}>
                  <SelectTrigger className='col-span-3'>
                    <SelectValue placeholder='Select a saving goal' />
                  </SelectTrigger>
                  <SelectContent>
                    {savings.map((saving) => {
                      const remaining = saving.targetAmount - (saving.currentAmount || 0);
                      return (
                        <SelectItem key={saving.id} value={saving.id.toString()}>
                          {saving.name} - {userCurrencySymbol}{remaining.toFixed(2)} 
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Payment Method */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='paymentMethod' className='text-left'>Payment Method *</Label>
              <Select value={formData.paymentMethodId} onValueChange={(value) => handleFormChange('paymentMethodId', value)}>
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select payment method' />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id.toString()}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Beautiful Date Picker with Calendar */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='date' className='text-right'>Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !formData.date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.date ? format(new Date(formData.date + 'T00:00:00'), "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.date ? new Date(formData.date + 'T00:00:00') : undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Picker */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='time-picker' className='text-right'>Time *</Label>
              <div className='col-span-3 relative'>
                <Clock8Icon className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none' />
                <Input
                  type='time'
                  id='time-picker'
                  step='1'
                  value={formData.time}
                  onChange={(e) => handleFormChange('time', e.target.value)}
                  className='pl-9 [&::-webkit-calendar-picker-indicator]:hidden'
                />
              </div>
            </div>

            {/* Description */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='description' className='text-right'>Description</Label>
              <Input
                id='description'
                placeholder='Optional description'
                className='col-span-3'
                value={formData.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
              />
            </div>
          </div>

          <div className='flex gap-2 justify-end'>
            <Button 
              variant='outline' 
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button 
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleSubmitTransaction}
              disabled={formLoading}
            >
              {formLoading ? 'Creating...' : 'Create Transaction'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Transactions;