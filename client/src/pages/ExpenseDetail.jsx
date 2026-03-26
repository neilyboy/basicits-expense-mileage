import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Mail, Trash2, Pencil, Save, X } from 'lucide-react';
import { api } from '../api';
import { generateSingleExpensePDF } from '../utils/pdf';

export default function ExpenseDetail({ settings, pin }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [emailPresets, setEmailPresets] = useState([]);
  const [showEmail, setShowEmail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const loadExpense = () => api.getExpense(id).then(e => { setExpense(e); return e; }).catch(() => navigate('/history'));

  useEffect(() => {
    loadExpense().then(e => {
      if (e) setEditForm({
        category_id: e.category_id,
        vehicle_id: e.vehicle_id,
        amount: e.amount != null ? String(e.amount) : '',
        description: e.description || '',
        notes: e.notes || '',
        purchase_date: e.purchase_date || '',
        purchase_time: e.purchase_time || '',
        mileage_reading: e.mileage_reading != null ? String(e.mileage_reading) : '',
        receipt_photo: e.receipt_photo || null,
      });
    });
    api.getEmailPresets().then(setEmailPresets);
    api.getCategories().then(setCategories).catch(() => {});
    api.getVehicles().then(setVehicles).catch(() => {});
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return;
    if (!pin) { alert('Admin PIN required. Please log in via Admin first.'); return; }
    try {
      await api.deleteExpense(pin, id);
      navigate('/history');
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleSaveEdit = async () => {
    try {
      await api.updateExpense(id, {
        category_id: editForm.category_id,
        vehicle_id: editForm.vehicle_id,
        amount: editForm.amount !== '' ? parseFloat(editForm.amount) : null,
        description: editForm.description,
        notes: editForm.notes,
        purchase_date: editForm.purchase_date,
        purchase_time: editForm.purchase_time,
        mileage_reading: editForm.mileage_reading !== '' ? parseFloat(editForm.mileage_reading) : null,
        receipt_photo: editForm.receipt_photo,
        custom_fields: {},
      });
      setEditing(false);
      loadExpense();
    } catch (err) { alert('Save failed: ' + err.message); }
  };

  if (!expense) return <div className="page flex items-center justify-center"><p className="text-slate-500">Loading...</p></div>;

  const handlePDF = async () => {
    try {
      await generateSingleExpensePDF(expense, settings.company_name || 'Basic ITS');
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
  };

  const handleEmail = (preset) => {
    setShowEmail(false);
    const subject = (preset.subject_template || settings.default_email_subject || 'Expense Receipt - {date}')
      .replace('{date}', expense.purchase_date)
      .replace('{category}', expense.category_name || '')
      .replace('{amount}', expense.amount ? `$${parseFloat(expense.amount).toFixed(2)}` : '');

    const body = [
      `Expense Report - ${settings.company_name || 'Basic ITS'}`,
      '',
      `Date: ${expense.purchase_date}`,
      expense.category_name ? `Category: ${expense.category_name}` : '',
      expense.amount ? `Amount: $${parseFloat(expense.amount).toFixed(2)}` : '',
      expense.description ? `Description: ${expense.description}` : '',
      expense.vehicle_label ? `Vehicle: ${expense.vehicle_label}` : '',
      expense.mileage_reading ? `Mileage: ${expense.mileage_reading}` : '',
      expense.notes ? `Notes: ${expense.notes}` : '',
    ].filter(Boolean).join('\n');

    const mailto = `mailto:${preset.email_address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate('/history')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Expense Detail</h1>
        <button onClick={() => setEditing(true)} className="p-2 rounded-xl bg-slate-800 text-slate-400">
          <Pencil size={18} />
        </button>
        <button onClick={handleDelete} className="p-2 rounded-xl bg-slate-800 text-red-400">
          <Trash2 size={18} />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Receipt Photo */}
        {expense.receipt_photo && (
          <div className="card p-2">
            <img src={expense.receipt_photo} alt="Receipt" className="w-full max-h-80 object-contain rounded-xl" />
          </div>
        )}

        {/* Details Card */}
        <div className="card space-y-3">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <span className="text-3xl">{expense.category_icon || '📋'}</span>
            <div>
              <p className="font-bold text-lg">{expense.category_name || 'Uncategorized'}</p>
              <p className="text-slate-400 text-sm">{expense.purchase_date} at {expense.purchase_time}</p>
            </div>
          </div>

          {expense.amount && (
            <div className="flex justify-between">
              <span className="text-slate-400">Amount</span>
              <span className="font-bold text-xl">${parseFloat(expense.amount).toFixed(2)}</span>
            </div>
          )}
          {expense.description && (
            <div className="flex justify-between">
              <span className="text-slate-400">Description</span>
              <span className="font-medium text-right">{expense.description}</span>
            </div>
          )}
          {expense.vehicle_label && (
            <div className="flex justify-between">
              <span className="text-slate-400">Vehicle</span>
              <span className="font-medium">{expense.vehicle_label}</span>
            </div>
          )}
          {expense.mileage_reading && (
            <div className="flex justify-between">
              <span className="text-slate-400">Mileage</span>
              <span className="font-medium">{expense.mileage_reading}</span>
            </div>
          )}
          {expense.notes && (
            <div>
              <span className="text-slate-400 text-sm">Notes</span>
              <p className="text-sm mt-1">{expense.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={handlePDF} className="btn-primary w-full">
            <FileDown size={20} /> Download PDF
          </button>

          <button onClick={() => setShowEmail(!showEmail)} className="btn-secondary w-full">
            <Mail size={20} /> Email Receipt
          </button>

          {showEmail && (
            <div className="card space-y-2">
              {emailPresets.length === 0 && (
                <p className="text-slate-500 text-sm text-center py-2">No email presets configured. Add them in Admin.</p>
              )}
              {emailPresets.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleEmail(p)}
                  className="w-full text-left p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all"
                >
                  <p className="font-medium text-sm">{p.label}</p>
                  <p className="text-xs text-slate-400">{p.email_address}</p>
                </button>
              ))}
              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-500 mb-2">Or enter email manually:</p>
                <button
                  onClick={() => {
                    const email = prompt('Enter email address:');
                    if (email) handleEmail({ email_address: email, subject_template: '' });
                  }}
                  className="btn-ghost w-full text-sm py-2"
                >
                  Custom Email Address
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && editForm && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-end sm:items-center justify-center">
          <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-800 p-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit Expense</h2>
              <button onClick={() => setEditing(false)} className="p-2 rounded-xl bg-slate-800"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Category</label>
                <select value={editForm.category_id || ''} onChange={e => setEditForm(f => ({ ...f, category_id: parseInt(e.target.value) || null }))}>
                  <option value="">None</option>
                  {categories.map(c => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Amount</label>
                <input type="number" inputMode="decimal" step="0.01" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <input type="text" value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this for?" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Vehicle</label>
                <select value={editForm.vehicle_id || ''} onChange={e => setEditForm(f => ({ ...f, vehicle_id: parseInt(e.target.value) || null }))}>
                  <option value="">None</option>
                  {vehicles.map(v => (<option key={v.id} value={v.id}>{v.label}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Date</label>
                  <input type="date" value={editForm.purchase_date} onChange={e => setEditForm(f => ({ ...f, purchase_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Time</label>
                  <input type="time" value={editForm.purchase_time} onChange={e => setEditForm(f => ({ ...f, purchase_time: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Mileage Reading</label>
                <input type="number" inputMode="decimal" value={editForm.mileage_reading} onChange={e => setEditForm(f => ({ ...f, mileage_reading: e.target.value }))} placeholder="Odometer" />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Notes</label>
                <input type="text" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
              <button onClick={handleSaveEdit} className="btn-primary w-full mt-2">
                <Save size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
