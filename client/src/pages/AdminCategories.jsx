import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, Save, X } from 'lucide-react';
import { api } from '../api';

const FOLLOW_UP_TYPES = [
  { value: 'none', label: 'None — Go straight to details' },
  { value: 'vehicle', label: 'Vehicle — Ask which vehicle' },
  { value: 'vehicle_mileage', label: 'Vehicle + Mileage — Ask vehicle & odometer' },
];

const EMOJI_OPTIONS = ['📋', '⛽', '🔧', '🛠️', '💼', '📎', '🍔', '🏗️', '🚗', '✈️', '🏨', '📱', '💻', '🧾', '🎟️', '📦', '🔌', '🧰', '🪜', '🧹'];

export default function AdminCategories({ pin }) {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '📋', sort_order: 0, follow_up_type: 'none', active: 1 });

  const load = () => api.getAllCategories(pin).then(setCategories);
  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name: '', icon: '📋', sort_order: categories.length, follow_up_type: 'none', active: 1 });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon, sort_order: cat.sort_order, follow_up_type: cat.follow_up_type, active: cat.active });
    setEditing(cat.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await api.updateCategory(pin, editing, form);
      } else {
        await api.createCategory(pin, form);
      }
      setShowForm(false);
      load();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category? Existing expenses using it will show as uncategorized.')) return;
    try {
      await api.deleteCategory(pin, id);
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
        <h1 className="font-semibold text-lg flex-1">Categories</h1>
        <button onClick={openNew} className="p-2 rounded-xl bg-brand-500">
          <Plus size={18} />
        </button>
      </div>

      {/* Category List */}
      <div className="px-4 py-4 space-y-2">
        {categories.map(cat => (
          <div key={cat.id} className={`card flex items-center gap-3 p-3 ${!cat.active ? 'opacity-50' : ''}`}>
            <span className="text-2xl">{cat.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{cat.name}</p>
              <p className="text-[10px] text-slate-500">
                {FOLLOW_UP_TYPES.find(f => f.value === cat.follow_up_type)?.label || cat.follow_up_type}
              </p>
            </div>
            <button onClick={() => openEdit(cat)} className="p-2 rounded-lg bg-slate-800 text-slate-400">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg bg-slate-800 text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-slate-500 text-center py-8">No categories yet. Tap + to add one.</p>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{editing ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-xl bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Fuel, Tools, Meals..."
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm(f => ({ ...f, icon: emoji }))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        form.icon === emoji ? 'bg-brand-500 ring-2 ring-brand-400' : 'bg-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">After selecting this category...</label>
                <select
                  value={form.follow_up_type}
                  onChange={e => setForm(f => ({ ...f, follow_up_type: e.target.value }))}
                >
                  {FOLLOW_UP_TYPES.map(ft => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Sort Order</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>

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

              <button onClick={handleSave} className="btn-primary w-full mt-2">
                <Save size={18} /> {editing ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
