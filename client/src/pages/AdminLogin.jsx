import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Shield } from 'lucide-react';
import { api } from '../api';

export default function AdminLogin({ onAuth }) {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.verifyPin(pin);
      onAuth(pin);
      navigate('/admin/dashboard');
    } catch (err) {
      setError('Invalid PIN');
      setPin('');
    }
    setLoading(false);
  };

  const handlePinInput = (digit) => {
    if (pin.length < 8) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Admin</h1>
      </div>

      <div className="px-4 py-8 flex flex-col items-center">
        <div className="bg-brand-500/20 rounded-full p-5 mb-6">
          <Shield size={40} className="text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Admin Access</h2>
        <p className="text-slate-400 text-sm mb-8">Enter your PIN to continue</p>

        {/* PIN dots */}
        <div className="flex gap-3 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all ${
                i < pin.length ? 'bg-brand-400 scale-110' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => {
            if (key === null) return <div key={i} />;
            if (key === 'del') {
              return (
                <button
                  key={i}
                  onClick={handleDelete}
                  className="aspect-square rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 active:bg-slate-700 transition-all"
                >
                  ←
                </button>
              );
            }
            return (
              <button
                key={i}
                onClick={() => handlePinInput(String(key))}
                className="aspect-square rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-semibold active:bg-slate-700 transition-all"
              >
                {key}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 w-full max-w-[280px]">
          <button
            type="submit"
            disabled={pin.length < 4 || loading}
            className="btn-primary w-full"
          >
            <Lock size={18} /> {loading ? 'Verifying...' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}
