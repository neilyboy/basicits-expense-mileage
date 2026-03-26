import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Mail, Star } from 'lucide-react';
import { api } from '../api';

export default function AdminEmailPresets({ pin }) {
  const navigate = useNavigate();
  const [presets, setPresets] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', email_address: '', subject_template: '', is_default: false });

  const load = () => api.getEmailPresets().then(setPresets);
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ label: '', email_address: '', subject_template: 'Expense Receipt - {date}', is_default: false });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setForm({ label: p.label, email_address: p.email_address, subject_template: p.subject_template, is_default: !!p.is_default });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.email_address.trim()) { alert('Label and email are required'); return; }
    try {
      if (editing) {
        await api.updateEmailPreset(pin, editing, { ...form, is_default: form.is_default ? 1 : 0, active: 1 });
      } else {
        await api.createEmailPreset(pin, { ...form, is_default: form.is_default ? 1 : 0 });
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this email preset?')) return;
    try {
      await api.deleteEmailPreset(pin, id);
      load();
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
        <h1 className="font-semibold text-lg flex-1">Email Presets</h1>
        <button onClick={openNew} className="p-2 rounded-xl bg-amber-600">
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-2">
        <p className="text-xs text-slate-500 mb-3">Configure email recipients for sending receipts. Uses your phone's default email app.</p>
        
        {presets.map(p => (
          <div key={p.id} className="card flex items-center gap-3 p-3">
            <div className="bg-amber-500/20 rounded-xl p-2">
              <Mail size={18} className="text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{p.label}</p>
                {p.is_default ? <Star size={12} className="text-amber-400 fill-amber-400" /> : null}
              </div>
              <p className="text-[10px] text-slate-500 truncate">{p.email_address}</p>
            </div>
            <button onClick={() => openEdit(p)} className="p-2 rounded-lg bg-slate-800 text-slate-400">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(p.id)} className="p-2 rounded-lg bg-slate-800 text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {presets.length === 0 && (
          <p className="text-slate-500 text-center py-8">No email presets yet. Tap + to add one.</p>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Preset' : 'New Email Preset'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Label</label>
                <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Billing Department" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Email Address</label>
                <input type="email" value={form.email_address} onChange={e => setForm(f => ({ ...f, email_address: e.target.value }))} placeholder="billing@company.com" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Subject Template</label>
                <input type="text" value={form.subject_template} onChange={e => setForm(f => ({ ...f, subject_template: e.target.value }))} placeholder="Expense Receipt - {date}" />
                <p className="text-[10px] text-slate-600 mt-1">Variables: {'{date}'}, {'{category}'}, {'{amount}'}</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600"
                />
                <div>
                  <span className="text-sm font-medium">Default Recipient</span>
                  <p className="text-[10px] text-slate-400">Pre-selected when emailing receipts</p>
                </div>
              </label>

              <button onClick={handleSave} className="btn-primary w-full mt-2 bg-amber-600 hover:bg-amber-500">
                <Save size={18} /> {editing ? 'Update Preset' : 'Create Preset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
