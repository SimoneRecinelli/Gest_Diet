"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Login() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    if (res.ok) {
      router.push('/');
      router.refresh(); // Forza il ricaricamento per applicare il middleware
    } else {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-lg border border-slate-200 p-8 text-center">
        
        <div className="h-16 w-16 bg-teal-500 text-white rounded-2xl flex items-center justify-center font-extrabold text-2xl shadow-md mx-auto mb-6">
          SR
        </div>
        
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">DietOS</h1>
        <p className="text-sm font-medium text-slate-500 mb-8">Area Privata</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Inserisci la password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-400 bg-red-50 focus:ring-red-500' : 'border-slate-300 bg-slate-50 focus:ring-teal-500'} focus:outline-none focus:ring-2 transition-all text-center font-bold tracking-widest text-slate-900`}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-bold py-3 rounded-xl transition-all shadow-sm flex justify-center items-center"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}