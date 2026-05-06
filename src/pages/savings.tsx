import { useState, useEffect } from 'react';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Trash2, Edit2, Copy, Calendar as CalendarIcon } from 'lucide-react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import savingService from '@/api/savingService';
import userService from '@/api/userService';

function Savings() {
  const { formatAmount: formatCurrencyAmount } = useCurrency();
  
  //  Modal states
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  
  //  Goal form states
  const [goalFormData, setGoalFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
  });
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  
  //  Calendar picker state
  const [dateOpen, setDateOpen] = useState(false);
  
  //  Join form states
  const [joinCode, setJoinCode] = useState('');
  
  //  Contributors modal states
  const [selectedGoalContributors, setSelectedGoalContributors] = useState<any[]>([]);
  const [selectedGoalName, setSelectedGoalName] = useState<string>('');
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [savingGoals, setSavingGoals] = useState<any[]>([]);

  //  Fetch current user and user's savings
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const user = await userService.getCurrentUser();
        setCurrentUser(user);

        const userSavings = await savingService.getAllUserSavings(user.id);
        setSavingGoals(userSavings);

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch savings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  //  Calculate stats
  const totalSavings = savingGoals.reduce((sum, goal) => sum + (goal.currentAmount || 0), 0);
  const totalTarget = savingGoals.reduce((sum, goal) => sum + (goal.targetAmount || 0), 0);
  const completedGoals = savingGoals.filter(goal => goal.currentAmount >= goal.targetAmount).length;
  const averageProgress = savingGoals.length > 0
    ? (totalSavings / totalTarget) * 100
    : 0;

  //  Reset goal form
  const resetGoalForm = () => {
    setGoalFormData({
      name: '',
      targetAmount: '',
      targetDate: '',
      description: '',
    });
    setEditingGoalId(null);
    setFormError(null);
  };

  //  Reset join form
  const resetJoinForm = () => {
    setJoinCode('');
    setFormError(null);
  };

  //  Handle date selection from calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setGoalFormData(prev => ({
        ...prev,
        targetDate: format(date, 'yyyy-MM-dd')
      }));
      setDateOpen(false);
    }
  };

  //  Handle Create Saving Goal
  const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!goalFormData.name || !goalFormData.targetAmount || !goalFormData.targetDate) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      if (!currentUser) {
        setFormError('User not loaded. Please refresh the page.');
        setSubmitting(false);
        return;
      }

      const newSavingData = {
        name: goalFormData.name,
        targetAmount: parseFloat(goalFormData.targetAmount),
        targetDate: formatDateWithTime(goalFormData.targetDate),
        description: goalFormData.description,
        userIds: [currentUser.id],
      };

      const createdSaving = await savingService.createSaving(newSavingData);
      setSavingGoals([...savingGoals, createdSaving]);
      resetGoalForm();
      setShowGoalModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create saving goal');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Update Saving Goal
  const handleUpdateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!goalFormData.name || !goalFormData.targetAmount || !goalFormData.targetDate) {
      setFormError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);

      const updatedData = {
        name: goalFormData.name,
        targetAmount: parseFloat(goalFormData.targetAmount),
        targetDate: goalFormData.targetDate,
        description: goalFormData.description,
      };

      await savingService.updateSaving(editingGoalId!, updatedData);

      setSavingGoals(
        savingGoals.map(g =>
          g.id === editingGoalId
            ? { ...g, ...updatedData }
            : g
        )
      );

      resetGoalForm();
      setShowGoalModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update saving goal');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Edit Saving Goal
  const handleEditGoal = (id: number) => {
    const goal = savingGoals.find(g => g.id === id);
    if (goal) {
      setEditingGoalId(id);
      setGoalFormData({
        name: goal.name,
        targetAmount: goal.targetAmount.toString(),
        targetDate: goal.targetDate,
        description: goal.description || '',
      });
      setShowGoalModal(true);
    }
  };

  //  Handle Join Goal with Code
  const handleJoinGoal = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    try {
      setSubmitting(true);
      const allSavings = await savingService.getAllSavings();
      const goal = allSavings.find((g: any) => g.code && g.code.toUpperCase() === joinCode.toUpperCase());

      if (!goal) {
        setFormError('Invalid code. Please check and try again.');
        setSubmitting(false);
        return;
      }

      if (goal.contributors && goal.contributors.some((c: any) => c.userId === currentUser?.id)) {
        setFormError('You already joined this goal!');
        setSubmitting(false);
        return;
      }

      await savingService.joinSaving(currentUser.id, goal.id, {
        userId: currentUser.id,
        savingId: goal.id,
      });

      alert(`Successfully joined "${goal.name}"!`);

      const updatedSavings = await savingService.getAllUserSavings(currentUser.id);
      setSavingGoals(updatedSavings);

      resetJoinForm();
      setShowJoinModal(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to join goal');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Delete Saving Goal
  const handleDeleteGoal = async () => {
    if (deleteId !== null) {
      try {
        setSubmitting(true);
        await savingService.removeSavingFromUser(currentUser.id, deleteId);
        setSavingGoals(savingGoals.filter(g => g.id !== deleteId));

        setDeleteId(null);
        setShowDeleteDialog(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete goal');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  //  Open Contributors Modal
  const openContributorsModal = (goal: any) => {
    setSelectedGoalName(goal.name);
    setSelectedGoalContributors(goal.contributors || []);
    setShowContributorsModal(true);
  };

  //  Copy code to clipboard
  const copyCodeToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const openDeleteDialog = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const formatDateWithTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
    return date.toISOString();
  };

  return (
    <div>
      <main className='p-6'>

        {/* Error Message */}
        {error && (
          <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded mb-6'>
            {error}
          </div>
        )}

        {/* Savings Stats */}
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8'>
          {/* Total Target */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Target</CardTitle>
              <CardDescription>All goals combined</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold'>{formatCurrencyAmount(totalTarget)}</p>
              <p className='text-xs text-muted-foreground mt-2'>{savingGoals.length} goals</p>
            </CardContent>
          </Card>

          {/* Total Saved */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Total Saved</CardTitle>
              <CardDescription>Current progress</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-green-600'>{formatCurrencyAmount(totalSavings)}</p>
              <div className='mt-3'>
                <Progress value={averageProgress} className='h-2' />
              </div>
              <p className='text-xs text-muted-foreground mt-2'>{averageProgress.toFixed(1)}% of target</p>
            </CardContent>
          </Card>

          {/* Remaining */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Remaining</CardTitle>
              <CardDescription>To reach all goals</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-blue-600'>{formatCurrencyAmount(totalTarget - totalSavings)}</p>
              <p className='text-xs text-muted-foreground mt-2'>Still needed</p>
            </CardContent>
          </Card>

          {/* Completed Goals */}
          <Card>
            <CardHeader>
              <CardTitle className='text-sm'>Completed Goals</CardTitle>
              <CardDescription>Reached targets</CardDescription>
            </CardHeader>
            <CardContent>
              <p className='text-2xl font-bold text-purple-600'>{completedGoals}</p>
              <p className='text-xs text-muted-foreground mt-2'>of {savingGoals.length} goals</p>
            </CardContent>
          </Card>
        </div>

        {/* Savings Goals Table */}
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
              <div>
                <CardTitle>Your Saving Goals</CardTitle>
                <CardDescription>{savingGoals.length} goals in total</CardDescription>
              </div>
              <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                {/*  Join Goal Button - Opens Modal */}
                <Button
                  onClick={() => {
                    resetJoinForm();
                    setShowJoinModal(true);
                  }}
                  className='bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 w-full sm:w-auto'
                  disabled={loading}
                >
                  Join Goal
                </Button>
                {/*  Create Goal Button - Opens Modal */}
                <Button
                  onClick={() => {
                    resetGoalForm();
                    setShowGoalModal(true);
                  }}
                  className='bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 w-full sm:w-auto'
                  disabled={loading}
                >
                  Create Goal
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className='text-muted-foreground text-center py-8'>Loading savings goals...</p>
            ) : savingGoals.length === 0 ? (
              <p className='text-muted-foreground text-center py-8'>No saving goals yet</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Goal Name</TableHead>
                      <TableHead className='text-right'>Target Amount</TableHead>
                      <TableHead className='text-right'>Saved</TableHead>
                      <TableHead className='text-right'>Remaining</TableHead>
                      <TableHead className='text-center'>Progress</TableHead>
                      <TableHead>Target Date</TableHead>
                      <TableHead className='text-center'>Code</TableHead>
                      <TableHead className='text-center'>Contributors</TableHead>
                      <TableHead className='text-center'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {savingGoals.map((goal: any) => {
                      const percentage = getProgressPercentage(goal.currentAmount || 0, goal.targetAmount || 0);
                      const remaining = (goal.targetAmount || 0) - (goal.currentAmount || 0);

                      return (
                        <TableRow key={goal.id}>
                          <TableCell className='font-medium'>
                            <div>
                              <p>{goal.name}</p>
                              {goal.description && (
                                <p className='text-xs text-muted-foreground'>{goal.description}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-right font-semibold'>
                            {formatCurrencyAmount(goal.targetAmount || 0)}
                          </TableCell>
                          <TableCell className='text-right'>
                            <span className={(goal.currentAmount || 0) > 0 ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                              {formatCurrencyAmount(goal.currentAmount || 0)}
                            </span>
                          </TableCell>
                          <TableCell className='text-right'>
                            <span className={remaining > 0 ? 'text-blue-600 font-medium' : 'text-green-600 font-bold'}>
                              {formatCurrencyAmount(remaining)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-3 justify-center'>
                              <div className='w-24'>
                                <Progress
                                  value={percentage}
                                  className='h-2'
                                />
                              </div>
                              <span className='text-sm font-semibold w-12 text-right'>
                                {percentage.toFixed(0)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className='text-sm'>
                            {formatDate(goal.targetDate || '')}
                          </TableCell>
                          <TableCell className='text-center'>
                            <div className='flex items-center justify-center gap-2'>
                              <div className='bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-3 py-1 rounded font-mono font-bold text-sm'>
                                {goal.code || 'N/A'}
                              </div>
                              {goal.code && (
                                <Button
                                  onClick={() => copyCodeToClipboard(goal.code)}
                                  variant='ghost'
                                  size='sm'
                                  className='h-6 w-6 p-0'
                                >
                                  <Copy className='w-4 h-4' />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className='text-center'>
                            {goal.contributors && goal.contributors.length > 0 ? (
                              <Button
                                onClick={() => openContributorsModal(goal)}
                                variant='outline'
                                size='sm'
                                className='gap-2'
                              >
                                {goal.contributors.length} people
                              </Button>
                            ) : (
                              <span className='text-xs text-muted-foreground'>No contributors</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className='flex gap-2 justify-center'>
                              <Button
                                onClick={() => handleEditGoal(goal.id)}
                                variant='outline'
                                size='sm'
                                className='gap-2'
                                disabled={submitting}
                              >
                                <Edit2 className='w-4 h-4' />
                                Edit
                              </Button>
                              <Button
                                onClick={() => openDeleteDialog(goal.id)}
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

      {/*  Create/Edit Goal Modal */}
      <Dialog open={showGoalModal} onOpenChange={setShowGoalModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>{editingGoalId ? 'Edit Saving Goal' : 'Create New Saving Goal'}</DialogTitle>
            <DialogDescription>
              {editingGoalId ? 'Update your saving goal' : 'Set up a new savings goal'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded'>
              {formError}
            </div>
          )}

          <form onSubmit={editingGoalId ? handleUpdateGoal : handleCreateGoal} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Goal Name *</Label>
              <Input
                id='name'
                placeholder='e.g., Vacation, Car, House'
                value={goalFormData.name}
                onChange={(e) => setGoalFormData({ ...goalFormData, name: e.target.value })}
                required
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='targetAmount'>Target Amount *</Label>
              <Input
                id='targetAmount'
                type='number'
                step='0.01'
                placeholder='e.g., 5000'
                value={goalFormData.targetAmount}
                onChange={(e) => setGoalFormData({ ...goalFormData, targetAmount: e.target.value })}
                required
              />
            </div>

            {/* Calendar Date Picker */}
            <div className='space-y-2'>
              <Label htmlFor='targetDate'>Target Date *</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !goalFormData.targetDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {goalFormData.targetDate 
                      ? format(new Date(goalFormData.targetDate + 'T00:00:00'), 'MMM dd, yyyy')
                      : 'Pick a date'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={goalFormData.targetDate ? new Date(goalFormData.targetDate + 'T00:00:00') : undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) =>
                      date < new Date(new Date().setHours(0, 0, 0, 0)) || date < new Date('1900-01-01')
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Input
                id='description'
                placeholder='Optional description'
                value={goalFormData.description}
                onChange={(e) => setGoalFormData({ ...goalFormData, description: e.target.value })}
              />
            </div>

            <div className='flex gap-2 justify-end pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowGoalModal(false);
                  resetGoalForm();
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
                {submitting ? 'Saving...' : editingGoalId ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/*  Join Goal Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Join a Saving Goal</DialogTitle>
            <DialogDescription>
              Enter the code to join someone's mutual saving goal
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className='bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded'>
              {formError}
            </div>
          )}

          <form onSubmit={handleJoinGoal} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='joinCode'>Goal Code *</Label>
              <Input
                id='joinCode'
                placeholder='Enter the goal code'
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
              />
              <p className='text-xs text-muted-foreground'>Ask the goal creator for the code</p>
            </div>

            <div className='flex gap-2 justify-end pt-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setShowJoinModal(false);
                  resetJoinForm();
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
                {submitting ? 'Joining...' : 'Join Goal'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/*  Contributors Modal */}
      <Dialog open={showContributorsModal} onOpenChange={setShowContributorsModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Contributors - {selectedGoalName}</DialogTitle>
            <DialogDescription>
              People who are contributing to this saving goal
            </DialogDescription>
          </DialogHeader>

          {selectedGoalContributors.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No contributors yet</p>
            </div>
          ) : (
            <div className='space-y-4'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead className='text-right'>Contributed Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedGoalContributors.map((contributor: any) => (
                    <TableRow key={contributor.username}>
                      <TableCell className='font-medium'>
                        {contributor.username}
                      </TableCell>
                      <TableCell className='text-right font-semibold text-green-600'>
                        {formatCurrencyAmount(contributor.contributedAmount || 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Summary */}
              <div className='border-t pt-4 mt-4'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold'>Total Contributors:</span>
                  <span className='text-lg font-bold'>{selectedGoalContributors.length}</span>
                </div>
                <div className='flex justify-between items-center mt-2'>
                  <span className='font-semibold'>Total Contributed:</span>
                  <span className='text-lg font-bold text-green-600'>
                    {formatCurrencyAmount(selectedGoalContributors.reduce((sum, c) => sum + (c.contributedAmount || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/*  Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Saving Goal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this saving goal? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='flex gap-2 justify-end'>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGoal}
              className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600'
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default Savings;