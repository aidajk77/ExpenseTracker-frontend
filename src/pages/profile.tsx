import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User, Lock } from 'lucide-react';
import userService from '@/api/userService';
import currencyService from '@/api/currencyService';
import { useCurrency } from '@/hooks/useCurrency';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Validation schema
const profileSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  email: z.string().email('Invalid email address'),
  currencyId: z.number().min(1, 'Currency is required'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

type SettingsTab = 'profile' | 'security';

function Profile() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  //  User data from backend
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  //  Currencies list
  const [currencies, setCurrencies] = useState<any[]>([]);

  const { refreshCurrency } = useCurrency();

  // Profile Form
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      email: '',
      currencyId: 1,
    },
  });

  // Password Form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  //  Fetch current user data and currencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user
        const user = await userService.getCurrentUser();
        setCurrentUser(user);

        //  Fetch all currencies
        const currenciesList = await currencyService.getAllCurrencies();
        setCurrencies(currenciesList);

        //  Set form default values from backend
        profileForm.reset({
          username: user.username,
          email: user.email,
          currencyId: user.currencyId,
        });

        setErrorMessage(null);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [profileForm]);

  //  Handle Profile Update
  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      //  Call backend to update user
      const updateData: any = {
        username: data.username,
        email: data.email,
        currencyId: data.currencyId,
      };

      await userService.updateUser(currentUser.id, updateData);

      //  Update local state
      setCurrentUser({
        ...currentUser,
        ...data,
      });

      await refreshCurrency();

      localStorage.setItem('currencyUpdated', Date.now().toString());

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update profile');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  //  Handle Password Change
  const handlePasswordChange = async (data: PasswordFormData) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      await userService.changePassword(data);

      passwordForm.reset();
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to change password');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className='p-6'>
        <p className='text-muted-foreground text-center py-12'>Loading profile...</p>
      </main>
    );
  }

  return (
    <div>
      <main className='p-4 md:p-6'>

        {/* Page Title */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold'>Settings</h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className='mb-6 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-200 px-4 py-3 rounded'>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className='mb-6 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 px-4 py-3 rounded'>
            {errorMessage}
          </div>
        )}

        {/*  Tab Navigation */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as SettingsTab)}
          className='w-full'
        >
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='profile' className='gap-2'>
              <User className='w-4 h-4' />
              <span className='hidden sm:inline'>Profile</span>
            </TabsTrigger>
            <TabsTrigger value='security' className='gap-2'>
              <Lock className='w-4 h-4' />
              <span className='hidden sm:inline'>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab Content */}
          <TabsContent value='profile' className='mt-6'>
            {currentUser && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Avatar and Form */}
                  <div className='flex flex-col md:flex-row gap-8 md:gap-12'>
                    {/* Avatar Section */}
                    <div className='flex flex-col items-center md:items-start flex-shrink-0'>
                      <div className='w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-blue-200 dark:border-blue-800 flex items-center justify-center text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4'>
                        {currentUser.username?.charAt(0).toUpperCase()}
                      </div>
                      <p className='text-xs text-muted-foreground text-center md:text-left'>Member since</p>
                      <p className='text-sm font-medium text-center md:text-left'>
                        {new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Form Section */}
                    <div className='flex-1 w-full'>
                      <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className='space-y-6'>
                          <div className='grid gap-4 grid-cols-1 sm:grid-cols-2'>
                            {/* Username */}
                            <FormField
                              control={profileForm.control}
                              name='username'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Username</FormLabel>
                                  <FormControl>
                                    <Input placeholder='username' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Email */}
                            <FormField
                              control={profileForm.control}
                              name='email'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input type='email' placeholder='user@example.com' {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/*  Currency Dropdown */}
                            <FormField
                              control={profileForm.control}
                              name='currencyId'
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Currency</FormLabel>
                                  <Select 
                                    onValueChange={(value) => field.onChange(parseInt(value))}
                                    defaultValue={String(field.value)}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder='Select a currency' />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {currencies.map((currency) => (
                                        <SelectItem 
                                          key={currency.id} 
                                          value={String(currency.id)}
                                        >
                                          {currency.code}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className='flex gap-2 pt-4'>
                            <Button 
                              type='submit' 
                              className='bg-blue-600 hover:bg-blue-700 w-full sm:w-auto'
                              disabled={submitting}
                            >
                              {submitting ? 'Updating...' : 'Update account'}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Security Tab Content */}
          <TabsContent value='security' className='mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className='space-y-6 max-w-md'>
                    {/* Current Password */}
                    <FormField
                      control={passwordForm.control}
                      name='currentPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type='password' placeholder='Enter your current password' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* New Password */}
                    <FormField
                      control={passwordForm.control}
                      name='newPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type='password' placeholder='Enter your new password' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password */}
                    <FormField
                      control={passwordForm.control}
                      name='confirmPassword'
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type='password' placeholder='Confirm your new password' {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className='flex gap-2 pt-4'>
                      <Button 
                        type='submit' 
                        className='bg-blue-600 hover:bg-blue-700 w-full sm:w-auto'
                        disabled={submitting}
                      >
                        {submitting ? 'Updating...' : 'Update password'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default Profile;