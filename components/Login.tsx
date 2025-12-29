import React, { useState } from 'react';
// UPDATE IMPORT: Point to the new AuthContext file
import { useAuth } from '../context/AuthContext';
import { dataService } from '../services/dataService';
import { Button } from './ui/Button';
import { Lock, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const user = await dataService.login(email, password);
      if (user) {
        login(user);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
          setError('Invalid email or password.');
      } else if (err.code === 'auth/too-many-requests') {
          setError('Too many failed attempts. Try again later.');
      } else {
          setError('Login failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/image.png" alt="SwyftPOS Logo" className="h-26 w-auto" />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
              placeholder="you@swyftpos.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white text-gray-900"
                placeholder="••••••••"
                required
              />
              <Lock className="absolute right-3 top-2.5 text-gray-400" size={18} />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <Button type="submit" fullWidth size="lg" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
};