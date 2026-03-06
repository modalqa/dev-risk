'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      // Redirect — keep loading true so React doesn't re-render
      window.location.href = '/dashboard';
      return;
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent-blue flex items-center justify-center">
          <ShieldAlert className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="text-lg font-bold text-white">DevRisk AI</span>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-sm text-gray-400 mt-1">
          Sign in to your risk intelligence dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-8 text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full" loading={loading} size="lg">
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {/* Help information */}
      <div className="mt-6 p-4 bg-surface-2/50 rounded-lg border border-border/50">
        <p className="text-xs font-medium text-gray-400 mb-2">Need help?</p>
        <div className="space-y-1.5 text-xs text-gray-500">
          <p>
            <span className="text-gray-300">Don&apos;t have an account?</span><br/>
            Contact your administrator or super admin for registration
          </p>
          <p>
            <span className="text-gray-300">Forgot password?</span><br/>
            Contact your administrator for a password reset
          </p>
        </div>
      </div>
    </div>
  );
}
