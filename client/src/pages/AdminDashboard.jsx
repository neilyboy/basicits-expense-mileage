import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Tags, Truck, Mail, Settings, LogOut } from 'lucide-react';

const menuItems = [
  { path: '/admin/categories', icon: Tags, label: 'Categories', desc: 'Manage expense categories & workflow', color: 'brand' },
  { path: '/admin/vehicles', icon: Truck, label: 'Vehicles', desc: 'Manage vehicles & mileage tracking', color: 'emerald' },
  { path: '/admin/email', icon: Mail, label: 'Email Presets', desc: 'Configure email recipients', color: 'amber' },
  { path: '/admin/settings', icon: Settings, label: 'Settings', desc: 'App preferences & configuration', color: 'purple' },
];

const colorMap = {
  brand: { bg: 'bg-brand-500/20', text: 'text-brand-400' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

export default function AdminDashboard({ pin, onLogout }) {
  const navigate = useNavigate();

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Admin Panel</h1>
        <button onClick={() => { onLogout(); navigate('/'); }} className="p-2 rounded-xl bg-slate-800 text-red-400">
          <LogOut size={18} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="text-center mb-4">
          <img src="/logo.svg" alt="Basic ITS" className="h-8 w-auto mx-auto mb-2 opacity-50" />
          <p className="text-xs text-slate-500">PocketLedger Administration</p>
        </div>

        {menuItems.map(({ path, icon: Icon, label, desc, color }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="w-full card flex items-center gap-4 p-4 active:scale-[0.98] transition-all"
          >
            <div className={`${colorMap[color].bg} rounded-2xl p-3`}>
              <Icon size={24} className={colorMap[color].text} />
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold">{label}</p>
              <p className="text-slate-400 text-xs">{desc}</p>
            </div>
            <span className="text-slate-600 text-xl">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
