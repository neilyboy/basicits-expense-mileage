import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Mail, Trash2 } from 'lucide-react';
import { api } from '../api';
import { generateSingleExpensePDF } from '../utils/pdf';

export default function ExpenseDetail({ settings }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [expense, setExpense] = useState(null);
  const [emailPresets, setEmailPresets] = useState([]);
  const [showEmail, setShowEmail] = useState(false);

  useEffect(() => {
    api.getExpense(id).then(setExpense).catch(() => navigate('/history'));
    api.getEmailPresets().then(setEmailPresets);
  }, [id]);

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
    </div>
  );
}
