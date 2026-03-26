import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Check } from 'lucide-react';
import { api } from '../api';

export default function AdminSettings({ pin, settings, onSave }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: settings.company_name || 'Basic ITS',
    home_page: settings.home_page || 'expense',
    admin_pin: '',
    default_email_subject: settings.default_email_subject || 'Expense Receipt - {date}',
    mileage_reminder_frequency: settings.mileage_reminder_frequency || 'daily',
    mileage_vehicle_id: settings.mileage_vehicle_id || ''
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      const data = { ...form };
      if (!data.admin_pin) delete data.admin_pin;
      await api.updateSettings(pin, data);
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate('/admin/dashboard')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* General */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">General</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Company Name</label>
              <input type="text" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-slate-400 mb-1 block">Home Page Default</label>
              <select value={form.home_page} onChange={e => setForm(f => ({ ...f, home_page: e.target.value }))}>
                <option value="home">Home Screen (show all options)</option>
                <option value="expense">New Expense (jump straight in)</option>
                <option value="mileage">Mileage Log (jump straight in)</option>
              </select>
              <p className="text-[10px] text-slate-600 mt-1">What opens when you launch the app</p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Security</h3>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Change Admin PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={form.admin_pin}
              onChange={e => setForm(f => ({ ...f, admin_pin: e.target.value }))}
              placeholder="Leave blank to keep current"
            />
          </div>
        </section>

        {/* Email */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Email</h3>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Default Email Subject</label>
            <input type="text" value={form.default_email_subject} onChange={e => setForm(f => ({ ...f, default_email_subject: e.target.value }))} />
            <p className="text-[10px] text-slate-600 mt-1">Variables: {'{date}'}, {'{category}'}, {'{amount}'}</p>
          </div>
        </section>

        {/* Mileage */}
        <section>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Mileage</h3>
          <div>
            <label className="text-sm text-slate-400 mb-1 block">Reminder Frequency</label>
            <select value={form.mileage_reminder_frequency} onChange={e => setForm(f => ({ ...f, mileage_reminder_frequency: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="every_other_day">Every Other Day</option>
              <option value="weekly">Weekly</option>
              <option value="none">None</option>
            </select>
          </div>
        </section>

        <button onClick={handleSave} className="btn-primary w-full">
          {saved ? <><Check size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
