'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function DeviceAuthPage() {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setStatus('error');
      setMessage('Please sign in first');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/device/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userCode: code.toUpperCase().trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify code');
      }

      setStatus('success');
      setMessage('✓ Device authorized successfully! You can close this window.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to verify code');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full mx-4 border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-4">Device Authorization</h1>
          <p className="text-white/80 mb-6">
            Please sign in to authorize your device.
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-white text-purple-900 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full border border-white/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Authorize Device</h1>
          <p className="text-white/80">
            Enter the code shown on your device
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-white/80 mb-2">
              Device Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 text-center text-2xl font-mono tracking-wider"
              disabled={status === 'loading' || status === 'success'}
              required
            />
          </div>

          {message && (
            <div className={`p-4 rounded-lg ${
              status === 'success'
                ? 'bg-green-500/20 border border-green-500/50 text-green-100'
                : status === 'error'
                ? 'bg-red-500/20 border border-red-500/50 text-red-100'
                : ''
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || status === 'success' || !code}
            className="w-full bg-white text-purple-900 py-3 rounded-lg font-semibold hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Verifying...' : status === 'success' ? 'Authorized ✓' : 'Authorize Device'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm text-center">
            Signed in as <span className="text-white font-medium">{user.email}</span>
          </p>
          <p className="text-white/40 text-xs text-center mt-2">
            Wrong account?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-white underline hover:text-white/80"
            >
              Sign out
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
