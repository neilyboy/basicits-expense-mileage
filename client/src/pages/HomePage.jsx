import { useNavigate } from 'react-router-dom';
import { CreditCard, Gauge, Clock } from 'lucide-react';

export default function HomePage({ settings }) {
  const navigate = useNavigate();
  const homePage = settings.home_page || 'expense';

  // If configured to go straight to a specific page
  // We still show the home for flexibility

  return (
    <div className="page px-4 pt-6">
      {/* Logo */}
      <div className="flex justify-center mb-8 pt-4">
        <div className="bg-brand-600 rounded-3xl p-6 shadow-2xl shadow-brand-600/20">
          <img src="/logo.svg" alt="Basic ITS" className="h-12 w-auto" />
        </div>
      </div>

      <h1 className="text-3xl font-bold text-center mb-1">PocketLedger</h1>
      <p className="text-slate-400 text-center mb-10 text-sm">
        {settings.company_name || 'Basic ITS'} — Expense & Mileage Tracker
      </p>

      <div className="space-y-4">
        {/* New Expense */}
        <button
          onClick={() => navigate('/expense')}
          className="w-full card flex items-center gap-4 p-5 active:scale-[0.98] transition-all hover:border-brand-500/50"
        >
          <div className="bg-brand-500/20 rounded-2xl p-3">
            <CreditCard size={28} className="text-brand-400" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-lg">New Expense</p>
            <p className="text-slate-400 text-sm">Log a purchase or receipt</p>
          </div>
          <div className="text-slate-600 text-2xl">→</div>
        </button>

        {/* Mileage Entry */}
        <button
          onClick={() => navigate('/mileage')}
          className="w-full card flex items-center gap-4 p-5 active:scale-[0.98] transition-all hover:border-emerald-500/50"
        >
          <div className="bg-emerald-500/20 rounded-2xl p-3">
            <Gauge size={28} className="text-emerald-400" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-lg">Mileage Log</p>
            <p className="text-slate-400 text-sm">Record daily mileage</p>
          </div>
          <div className="text-slate-600 text-2xl">→</div>
        </button>

        {/* View History */}
        <button
          onClick={() => navigate('/history')}
          className="w-full card flex items-center gap-4 p-5 active:scale-[0.98] transition-all hover:border-amber-500/50"
        >
          <div className="bg-amber-500/20 rounded-2xl p-3">
            <Clock size={28} className="text-amber-400" />
          </div>
          <div className="text-left flex-1">
            <p className="font-semibold text-lg">History & Reports</p>
            <p className="text-slate-400 text-sm">View logs and export PDFs</p>
          </div>
          <div className="text-slate-600 text-2xl">→</div>
        </button>
      </div>
    </div>
  );
}
