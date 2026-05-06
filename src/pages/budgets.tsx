import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit2 } from 'lucide-react';
import budgetService from '@/api/budgetService';
import categoryService from '@/api/categoryService';
import userService from '@/api/userService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function Budgets() {
  const { formatAmount: formatCurrencyAmount } = useCurrency();
  
  //  Modal state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  
  const [deleteCategotyId, setDeleteCategoryId] = useState<number | null>(null);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  
  //  Budget form state
  const [budgetFormData, setBudgetFormData] = useState({ categoryId: '', budget: '' });
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null);
  
  //  Category form state
  const [categoryFormData, setCategoryFormData] = useState({ name: '' });
  
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  //  Fetch budgets, categories, and summary
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const currentUser = await userService.getCurrentUser();

        //  Get summary for current month
        const now = new Date();
        const summaryData = await budgetService.getUserBudgetSummaryForMonth(
          currentUser.id,
          now.getMonth() + 1,
          now.getFullYear()
        );
        setSummary(summaryData);

        // Fetch all budgets
        const userBudgets = await budgetService.getUserBudgets(currentUser.id);
        
        // Enrich budgets with category names
        const enrichedBudgets = await Promise.all(
          userBudgets.map(async (budget: any) => {
            const category = await categoryService.getCategoryById(budget.categoryId);
            return {
              ...budget,
              categoryName: category?.name || 'Unknown Category'
            };
          })
        );

        setBudgets(enrichedBudgets);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch budgets');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  //  Fetch categories for dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const allCategories = await categoryService.getAllCategories();
        setCategories(allCategories);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    if (showBudgetModal || showCategoryModal || showCategoriesModal) {
      fetchCategories();
    }
  }, [showBudgetModal, showCategoryModal, showCategoriesModal]);

  //  Reset budget form
  const resetBudgetForm = () => {
    setBudgetFormData({ categoryId: '', budget: '' });
    setEditingBudgetId(null);
    setFormError(null);
  };

  //  Reset category form
  const resetCategoryForm = () => {
    setCategoryFormData({ name: '' });
    setFormError(null);
  };

  //  Handle Create Budget
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!budgetFormData.categoryId || !budgetFormData.budget) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = await userService.getCurrentUser();
      const now = new Date();

      const newBudgetData = {
        userId: currentUser.id,
        categoryId: parseInt(budgetFormData.categoryId),
        amountLimit: parseFloat(budgetFormData.budget),
        currentAmount: 0,
        month: now.getMonth() + 1,
        year: now.getFullYear()
      };

      const createdBudget = await budgetService.createBudget(newBudgetData);
      
      // Fetch the category name
      const category = await categoryService.getCategoryById(createdBudget.categoryId);
      
      // Add to local state
      setBudgets([...budgets, {
        ...createdBudget,
        categoryName: category?.name || 'Unknown Category'
      }]);

      //  Refresh summary
      const summaryData = await budgetService.getUserBudgetSummaryForMonth(
        currentUser.id,
        now.getMonth() + 1,
        now.getFullYear()
      );
      setSummary(summaryData);

      resetBudgetForm();
      setShowBudgetModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create budget');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Update Budget
  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (editingBudgetId !== null && budgetFormData.categoryId && budgetFormData.budget) {
      try {
        setSubmitting(true);
        const currentUser = await userService.getCurrentUser();
        const now = new Date();

        const updateData = {
          amountLimit: parseFloat(budgetFormData.budget),
        };

        await budgetService.updateBudget(editingBudgetId, updateData);

        // Fetch the category name
        const category = await categoryService.getCategoryById(parseInt(budgetFormData.categoryId));

        // Update local state
        setBudgets(budgets.map(b =>
          b.id === editingBudgetId
            ? { 
                ...b, 
                categoryId: parseInt(budgetFormData.categoryId),
                amountLimit: parseFloat(budgetFormData.budget),
                categoryName: category?.name || 'Unknown Category'
              }
            : b
        ));

        //  Refresh summary
        const summaryData = await budgetService.getUserBudgetSummaryForMonth(
          currentUser.id,
          now.getMonth() + 1,
          now.getFullYear()
        );
        setSummary(summaryData);

        resetBudgetForm();
        setShowBudgetModal(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to update budget');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  //  Handle Edit Budget
  const handleEditBudget = (id: number) => {
    const budget = budgets.find(b => b.id === id);
    if (budget) {
      setEditingBudgetId(id);
      setBudgetFormData({ 
        categoryId: budget.categoryId.toString(), 
        budget: budget.amountLimit.toString() 
      });
      setShowBudgetModal(true);
    }
  };

  //  Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    if (!categoryFormData.name) {
      setFormError('Please enter a category name');
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = await userService.getCurrentUser();
      
      const newCategory = await categoryService.createCategory({
        name: categoryFormData.name,
        userId: currentUser.id  
      });
      
      // Add to local state
      setCategories([...categories, newCategory]);
      resetCategoryForm();
      setShowCategoryModal(false);

    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create category');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Delete Category
  const handleDeleteCategory = async () => {
    if (deleteCategotyId !== null) {
      try {
        setSubmitting(true);
        await categoryService.deleteCategory(deleteCategotyId);
        setCategories(categories.filter(c => c.id !== deleteCategotyId));

        setDeleteCategoryId(null);
        setShowDeleteCategoryDialog(false);
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Failed to delete category');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  //  Open delete category dialog
  const openDeleteCategoryDialog = (id: number) => {
    setDeleteCategoryId(id);
    setShowDeleteCategoryDialog(true);
  };

  const handleDeleteBudget = async () => {
    if (deleteId !== null) {
      try {
        setSubmitting(true);
        const currentUser = await userService.getCurrentUser();
        const now = new Date();

        await budgetService.deleteBudget(deleteId);
        setBudgets(budgets.filter(b => b.id !== deleteId));

        //  Refresh summary
        const summaryData = await budgetService.getUserBudgetSummaryForMonth(
          currentUser.id,
          now.getMonth() + 1,
          now.getFullYear()
        );
        setSummary(summaryData);

        setDeleteId(null);
        setShowDeleteDialog(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete budget');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const openDeleteDialog = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  // summary data
  const totalBudget = summary?.totalBudgetAmount || 0;
  const totalSpent = summary?.totalSpentAmount || 0;
  const totalRemaining = summary?.totalRemainingAmount || 0;
  const spentPercentage = summary?.spentPercentage || 0;

  const remainingPercentage = 100 - spentPercentage;
  const isLowBudget = remainingPercentage < 10;

  return (
    <div>
      <main className='p-6'>

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6'>
            {error}
          </div>
        )}

        {/* Budget Stats */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8'>
          {/* Total Spent */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Spent</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-red-600'>{formatCurrencyAmount(totalSpent)}</p>
              <div className='mt-3'>
                <Progress value={spentPercentage} className='h-2' />
              </div>
              <p className='text-xs text-muted-foreground mt-2'>{spentPercentage.toFixed(1)}% of budget</p>
            </CardContent>
          </Card>

          {/* Remaining */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Remaining</CardTitle>
              <CardDescription>This month</CardDescription>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${isLowBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrencyAmount(totalRemaining)}
              </p>
              <p className='text-xs text-muted-foreground mt-2'>{(100 - spentPercentage).toFixed(1)}% left</p>
            </CardContent>
          </Card>

          {/* At Risk */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Budgets At Risk</CardTitle>
              <CardDescription>Over 80%</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-orange-600'>
                {budgets.filter(b => {
                  const spent = b.currentAmount || 0;
                  const limit = b.amountLimit || 0;
                  const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                  return percentage > 80;
                }).length}
              </p>
              <p className='text-xs text-muted-foreground mt-2'>categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Budgets Table */}
        <Card>
          <CardHeader className='pb-6'>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div className='flex-1'>
                <CardTitle>Budget Details</CardTitle>
              </div>
              <div className='flex gap-2 flex-shrink-0'>
                {/*  See Categories Button */}
                <Button 
                  onClick={() => setShowCategoriesModal(true)} 
                  className='bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 whitespace-nowrap'
                  disabled={loading}
                  size='sm'
                >
                  See Categories
                </Button>
                {/*  Create Category Button - Opens Modal */}
                <Button 
                  onClick={() => {
                    resetCategoryForm();
                    setShowCategoryModal(true);
                  }} 
                  className='bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 whitespace-nowrap'
                  disabled={loading}
                  size='sm'
                >
                  Create Category
                </Button>
                {/*  Create Budget Button - Opens Modal */}
                <Button 
                  onClick={() => {
                    resetBudgetForm();
                    setShowBudgetModal(true);
                  }} 
                  className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 whitespace-nowrap'
                  disabled={loading}
                  size='sm'
                >
                  Create Budget
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className='text-muted-foreground text-center py-8'>Loading budgets...</p>
            ) : budgets.length === 0 ? (
              <p className='text-muted-foreground text-center py-8'>No budgets created yet</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className='text-right'>Budget Amount</TableHead>
                      <TableHead className='text-right'>Spent</TableHead>
                      <TableHead className='text-right'>Remaining</TableHead>
                      <TableHead className='text-center'>Usage</TableHead>
                      <TableHead className='text-center'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => {
                      const spent = budget.currentAmount || 0;
                      const limit = budget.amountLimit || 0;
                      const remaining = limit - spent;
                      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

                      return (
                        <TableRow key={budget.id}>
                          <TableCell className='font-medium'>{budget.categoryName}</TableCell>
                          <TableCell className='text-right font-semibold'>{formatCurrencyAmount(limit)}</TableCell>
                          <TableCell className='text-right text-red-600 font-medium'>
                            {formatCurrencyAmount(spent)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <span className={remaining >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {formatCurrencyAmount(remaining)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-3 justify-center'>
                              <div className='w-24'>
                                <Progress 
                                  value={Math.min(percentage, 100)} 
                                  className='h-2'
                                />
                              </div>
                              <span className='text-sm font-semibold w-12 text-right'>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2 justify-center'>
                              <Button 
                                onClick={() => handleEditBudget(budget.id)} 
                                variant='outline' 
                                size='sm'
                                className='gap-2'
                                disabled={submitting}
                              >
                                <Edit2 className='w-4 h-4' />
                                Edit
                              </Button>
                              <Button 
                                onClick={() => openDeleteDialog(budget.id)} 
                                variant='destructive' 
                                size='sm'
                                className='gap-2'
                                disabled={submitting}
                              >
                                <Trash2 className='w-4 h-4' />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/*  Add/Edit Budget Modal */}
      <Dialog open={showBudgetModal} onOpenChange={setShowBudgetModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{editingBudgetId ? 'Edit Budget' : 'Create New Budget'}</DialogTitle>
            <DialogDescription>
              {editingBudgetId ? 'Update your budget details' : 'Add a new spending budget'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded'>
              {formError}
            </div>
          )}

          <form onSubmit={editingBudgetId ? handleUpdateBudget : handleCreateBudget} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='category'>Category *</Label>
              <select
                id='category'
                className='w-full px-3 py-2 border border-input bg-background text-foreground rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 disabled:opacity-50'
                value={budgetFormData.categoryId}
                onChange={(e) => setBudgetFormData({ ...budgetFormData, categoryId: e.target.value })}
                required
              >
                <option value=''>Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='budget'>Budget Amount *</Label>
              <Input
                id='budget'
                type='number'
                step='0.01'
                placeholder='e.g., 500'
                value={budgetFormData.budget}
                onChange={(e) => setBudgetFormData({ ...budgetFormData, budget: e.target.value })}
                required
              />
            </div>

            <div className='flex gap-2 justify-end pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowBudgetModal(false);
                  resetBudgetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type='submit' 
                className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600'
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingBudgetId ? 'Update Budget' : 'Create Budget'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/*  Add Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              Add a new spending category
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded'>
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateCategory} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='categoryName'>Category Name *</Label>
              <Input
                id='categoryName'
                type='text'
                placeholder='e.g., Groceries, Entertainment, Utilities'
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ name: e.target.value })}
                required
              />
            </div>

            <div className='flex gap-2 justify-end pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowCategoryModal(false);
                  resetCategoryForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type='submit' 
                className='bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600'
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Category'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/*  Categories Modal - Like Contributors Modal */}
      <Dialog open={showCategoriesModal} onOpenChange={setShowCategoriesModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Your Categories</DialogTitle>
            <DialogDescription>
              Manage your spending categories
            </DialogDescription>
          </DialogHeader>

          {categories.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No categories yet</p>
            </div>
          ) : (
            <div className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category Name</TableHead>
                    <TableHead className='text-center'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category: any) => (
                    <TableRow key={category.id}>
                      <TableCell className='font-medium'>
                        {category.name}
                      </TableCell>
                      <TableCell className='text-center'>
                        <Button
                          onClick={() => openDeleteCategoryDialog(category.id)}
                          variant='destructive'
                          size='sm'
                          className='gap-2'
                          disabled={submitting}
                        >
                          <Trash2 className='w-4 h-4' />
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className='border-t pt-4 mt-4'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold'>Total Categories:</span>
                  <span className='text-lg font-bold'>{categories.length}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex gap-2 justify-end'>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Budget Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this budget? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex gap-2 justify-end'>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBudget}
              className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Budgets;