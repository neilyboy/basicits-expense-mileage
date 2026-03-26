import { useLocation, useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, Gauge, Settings } from 'lucide-react';

const tabs = [
  { path: '/', icon: PlusCircle, label: 'New' },
  { path: '/history', icon: Clock, label: 'History' },
  { path: '/mileage', icon: Gauge, label: 'Mileage' },
  { path: '/admin', icon: Settings, label: 'Admin' }
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide on admin sub-pages and expense flow
  if (location.pathname.startsWith('/admin/') || location.pathname === '/expense') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? 'text-brand-400' : 'text-slate-500'
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
