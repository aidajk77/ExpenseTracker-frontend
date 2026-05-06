import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import userService from '@/api/userService';

function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!username.trim() || !email.trim() || !password) {
      setError('All fields are required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.register({
        username,
        email,
        password,
        role: 1,
        currencyId: 1
      });

      setSuccess(true);
      // Store auth token if provided
      if (response.token) {
        localStorage.setItem('authToken', response.token);
        localStorage.setItem('userId', response.userId);
      }

      // Redirect to login or dashboard
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center p-4'>
      <div className='w-full max-w-md'>
        {/* Logo/Brand */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>MoneyMate</h1>
          <p className='text-gray-600 dark:text-gray-400'>Manage your money smarter</p>
        </div>

        {/* Signup Card - Match login styling */}
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Sign up to get started</CardDescription>
          </CardHeader>
          
          <CardContent className='space-y-6'>
            {/* Error Message */}
            {error && (
              <div className='p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200 text-sm font-medium'>
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className='p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-200 text-sm font-medium'>
                Account created successfully! Redirecting to login...
              </div>
            )}

            <form onSubmit={handleRegister} className='space-y-6'>
              {/* Username Input */}
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  type='text'
                  placeholder='username'
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Email Input */}
              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='john@example.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className='space-y-2'>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <p className='text-xs text-muted-foreground'>Must be at least 8 characters</p>
              </div>

              {/* Confirm Password Input */}
              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <Input
                  id='confirmPassword'
                  type='password'
                  placeholder='••••••••'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Sign Up Button */}
              <Button 
                type='submit'
                disabled={loading}
                className='w-full'
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            {/* Divider */}
            <Separator />

            {/* Sign In Link */}
            <p className='text-center text-sm text-muted-foreground'>
              Already have an account?{' '}
              <Link 
                to='/login' 
                className='text-foreground hover:underline font-semibold'
              >
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default Register;