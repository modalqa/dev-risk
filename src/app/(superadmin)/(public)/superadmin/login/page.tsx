'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminLoginPage() {
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
      const res = await fetch('/api/auth/superadmin/login', {
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
      window.location.href = '/superadmin';
      return;
    } catch {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">Super Admin Portal</p>
          <p className="text-xs text-gray-500">DevRisk AI</p>
        </div>
      </div>

      <div className="mb-7">
        <h1 className="text-2xl font-bold text-white">Admin Login</h1>
        <p className="text-sm text-gray-400 mt-1">Akses global management console</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Admin"
          type="email"
          placeholder="admin@devrisk.ai"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-8 text-gray-500 hover:text-gray-300"
          >
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3.5 py-2.5">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        <Button type="submit" className="w-full !bg-orange-600 hover:!bg-orange-700 !border-orange-500/50" loading={loading} size="lg">
          {loading ? 'Signing in...' : 'Sign in as Admin'}
        </Button>
      </form>

      <p className="text-center text-xs text-gray-600 mt-6">
        Tenant user?{' '}
        <Link href="/login" className="text-primary-light hover:text-primary">
          Login di sini
        </Link>
      </p>
    </div>
  );
}
