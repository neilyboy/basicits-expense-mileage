import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, Save, X, Gauge } from 'lucide-react';
import { api } from '../api';

export default function AdminVehicles({ pin }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', make: '', model: '', year: '', license_plate: '', color: '', track_mileage: 0, active: 1 });

  const load = () => api.getAllVehicles(pin).then(setVehicles);
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ label: '', make: '', model: '', year: '', license_plate: '', color: '', track_mileage: 0, active: 1 });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (v) => {
    setForm({ label: v.label, make: v.make, model: v.model, year: v.year, license_plate: v.license_plate, color: v.color, track_mileage: v.track_mileage, active: v.active });
    setEditing(v.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) { alert('Label is required'); return; }
    try {
      if (editing) {
        await api.updateVehicle(pin, editing, form);
      } else {
        await api.createVehicle(pin, form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await api.deleteVehicle(pin, id);
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
        <h1 className="font-semibold text-lg flex-1">Vehicles</h1>
        <button onClick={openNew} className="p-2 rounded-xl bg-emerald-600">
          <Plus size={18} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-2">
        {vehicles.map(v => (
          <div key={v.id} className={`card flex items-center gap-3 p-3 ${!v.active ? 'opacity-50' : ''}`}>
            <div className="bg-emerald-500/20 rounded-xl p-2">
              <Gauge size={18} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{v.label}</p>
              <p className="text-[10px] text-slate-500">
                {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                {v.license_plate ? ` • ${v.license_plate}` : ''}
                {v.track_mileage ? ' • 📍 Mileage Tracked' : ''}
              </p>
            </div>
            <button onClick={() => openEdit(v)} className="p-2 rounded-lg bg-slate-800 text-slate-400">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(v.id)} className="p-2 rounded-lg bg-slate-800 text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {vehicles.length === 0 && (
          <p className="text-slate-500 text-center py-8">No vehicles yet. Tap + to add one.</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Vehicle' : 'New Vehicle'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Label (display name)</label>
                <input type="text" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Work Truck, Service Van" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Make</label>
                  <input type="text" value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))} placeholder="Ford" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Model</label>
                  <input type="text" value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="F-150" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Year</label>
                  <input type="text" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">License Plate</label>
                  <input type="text" value={form.license_plate} onChange={e => setForm(f => ({ ...f, license_plate: e.target.value }))} placeholder="ABC-1234" />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Color</label>
                <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="White" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-800 rounded-xl">
                <input
                  type="checkbox"
                  checked={form.track_mileage === 1}
                  onChange={e => setForm(f => ({ ...f, track_mileage: e.target.checked ? 1 : 0 }))}
                  className="w-5 h-5 rounded bg-slate-700 border-slate-600"
                />
                <div>
                  <span className="text-sm font-medium">Track Mileage</span>
                  <p className="text-[10px] text-slate-400">Show this vehicle in the Mileage Log section</p>
                </div>
              </label>

              {editing && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active === 1}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))}
                    className="w-5 h-5 rounded bg-slate-800 border-slate-700"
                  />
                  <span className="text-sm">Active (visible to users)</span>
                </label>
              )}

              <button onClick={handleSave} className="btn-primary w-full mt-2 bg-emerald-600 hover:bg-emerald-500">
                <Save size={18} /> {editing ? 'Update Vehicle' : 'Create Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
