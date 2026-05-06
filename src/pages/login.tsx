import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import userService from '@/api/userService';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim() || !password) {
      setError('Email and password are required');
      return;
    }

    try {
      setLoading(true);
      const response = await userService.login({
        email,
        password,
      });
      console.log('Login response:', response);

      // Use context to store auth
      if (response.token && response.user?.id) {
        login(response.token, response.user.id.toString(), response.user.email);
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
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

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          
          <CardContent className='space-y-6'>
            {/* Error Message */}
            {error && (
              <div className='p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-200 text-sm font-medium'>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className='space-y-6'>
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
                <div className='flex justify-between items-center'>
                  <Label htmlFor='password'>Password</Label>
                  <Link 
                    to='/forgot-password' 
                    className='text-xs text-muted-foreground hover:underline'
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id='password'
                  type='password'
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Sign In Button */}
              <Button 
                type='submit'
                disabled={loading}
                className='w-full'
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <Separator />

            {/* Sign Up Link */}
            <p className='text-center text-sm text-muted-foreground'>
              Don't have an account?{' '}
              <Link 
                to='/register' 
                className='text-foreground hover:underline font-semibold'
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default Login;