import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight, DollarSign, FileText, Truck, Calendar } from 'lucide-react';
import { api } from '../api';
import CameraCapture from '../components/CameraCapture';

const STEPS = {
  RECEIPT: 'receipt',
  CATEGORY: 'category',
  VEHICLE: 'vehicle',
  DETAILS: 'details',
  CONFIRM: 'confirm',
  DONE: 'done'
};

export default function ExpenseFlow({ settings }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.RECEIPT);
  const [categories, setCategories] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [data, setData] = useState({
    receipt_photo: null,
    category_id: null,
    category_name: '',
    follow_up_type: 'none',
    vehicle_id: null,
    amount: '',
    description: '',
    notes: '',
    mileage_reading: '',
    purchase_date: new Date().toISOString().split('T')[0],
    purchase_time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    api.getCategories().then(setCategories);
    api.getVehicles().then(setVehicles);
  }, []);

  const update = (fields) => setData(prev => ({ ...prev, ...fields }));

  const handleCategorySelect = (cat) => {
    update({
      category_id: cat.id,
      category_name: cat.name,
      follow_up_type: cat.follow_up_type
    });
    if (cat.follow_up_type === 'vehicle' || cat.follow_up_type === 'vehicle_mileage') {
      setStep(STEPS.VEHICLE);
    } else {
      setStep(STEPS.DETAILS);
    }
  };

  const handleVehicleSelect = (v) => {
    update({ vehicle_id: v.id });
    setStep(STEPS.DETAILS);
  };

  const handleSubmit = async () => {
    try {
      await api.createExpense({
        category_id: data.category_id,
        vehicle_id: data.vehicle_id,
        amount: data.amount ? parseFloat(data.amount) : null,
        description: data.description,
        notes: data.notes,
        receipt_photo: data.receipt_photo,
        purchase_date: data.purchase_date,
        purchase_time: data.purchase_time,
        mileage_reading: data.mileage_reading ? parseFloat(data.mileage_reading) : null
      });
      setStep(STEPS.DONE);
    } catch (err) {
      alert('Failed to save expense: ' + err.message);
    }
  };

  const goBack = () => {
    const order = [STEPS.RECEIPT, STEPS.CATEGORY, STEPS.VEHICLE, STEPS.DETAILS, STEPS.CONFIRM];
    const idx = order.indexOf(step);
    if (idx <= 0) navigate('/');
    else {
      let prevStep = order[idx - 1];
      if (prevStep === STEPS.VEHICLE && data.follow_up_type !== 'vehicle' && data.follow_up_type !== 'vehicle_mileage') {
        prevStep = STEPS.CATEGORY;
      }
      setStep(prevStep);
    }
  };

  return (
    <div className="page">
      {/* Header */}
      {step !== STEPS.DONE && (
        <div className="page-header">
          <button onClick={goBack} className="p-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold text-lg flex-1">New Expense</h1>
          <StepIndicator step={step} hasVehicle={data.follow_up_type === 'vehicle' || data.follow_up_type === 'vehicle_mileage'} />
        </div>
      )}

      <div className="px-4 py-4">
        {/* Step: Receipt Photo */}
        {step === STEPS.RECEIPT && (
          <CameraCapture
            onCapture={(path) => { update({ receipt_photo: path }); setStep(STEPS.CATEGORY); }}
            onSkip={() => { update({ receipt_photo: null }); setStep(STEPS.CATEGORY); }}
          />
        )}

        {/* Step: Category Selection */}
        {step === STEPS.CATEGORY && (
          <div>
            <h2 className="text-2xl font-bold mb-1">What was this for?</h2>
            <p className="text-slate-400 text-sm mb-6">Select a category</p>
            <div className="grid grid-cols-2 gap-3">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  className="card flex flex-col items-center gap-2 p-5 active:scale-95 transition-all hover:border-brand-500/50"
                >
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="font-medium text-sm">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Vehicle Selection */}
        {step === STEPS.VEHICLE && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Select Vehicle</h2>
            <p className="text-slate-400 text-sm mb-6">Which vehicle was this for?</p>
            <div className="space-y-3">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => handleVehicleSelect(v)}
                  className="w-full card flex items-center gap-4 p-4 active:scale-[0.98] transition-all hover:border-brand-500/50"
                >
                  <Truck size={24} className="text-brand-400 shrink-0" />
                  <div className="text-left flex-1">
                    <p className="font-semibold">{v.label}</p>
                    <p className="text-slate-400 text-xs">
                      {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                      {v.license_plate ? ` • ${v.license_plate}` : ''}
                    </p>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </button>
              ))}
              {vehicles.length === 0 && (
                <p className="text-slate-500 text-center py-8">No vehicles configured. Add vehicles in Admin settings.</p>
              )}
              <button onClick={() => setStep(STEPS.DETAILS)} className="btn-ghost w-full text-slate-400">
                Skip Vehicle
              </button>
            </div>
          </div>
        )}

        {/* Step: Details */}
        {step === STEPS.DETAILS && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Details</h2>
            <p className="text-slate-400 text-sm mb-6">Enter expense information</p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Amount ($)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0.00"
                    value={data.amount}
                    onChange={e => update({ amount: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Description</label>
                <input
                  type="text"
                  placeholder="Brief description..."
                  value={data.description}
                  onChange={e => update({ description: e.target.value })}
                />
              </div>

              {(data.follow_up_type === 'vehicle_mileage') && (
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Current Mileage</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="Current odometer reading"
                    value={data.mileage_reading}
                    onChange={e => update({ mileage_reading: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={data.purchase_date}
                    onChange={e => update({ purchase_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Time</label>
                  <input
                    type="time"
                    value={data.purchase_time}
                    onChange={e => update({ purchase_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Notes (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Additional notes..."
                  value={data.notes}
                  onChange={e => update({ notes: e.target.value })}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <button onClick={() => setStep(STEPS.CONFIRM)} className="btn-primary w-full mt-2">
                Review & Submit
              </button>
            </div>
          </div>
        )}

        {/* Step: Confirm */}
        {step === STEPS.CONFIRM && (
          <div>
            <h2 className="text-2xl font-bold mb-4">Review Expense</h2>
            <div className="card space-y-3 mb-6">
              {data.receipt_photo && (
                <img src={data.receipt_photo} alt="Receipt" className="receipt-preview" />
              )}
              <Row label="Category" value={data.category_name} />
              {data.amount && <Row label="Amount" value={`$${parseFloat(data.amount).toFixed(2)}`} />}
              {data.description && <Row label="Description" value={data.description} />}
              {data.vehicle_id && <Row label="Vehicle" value={vehicles.find(v => v.id === data.vehicle_id)?.label} />}
              {data.mileage_reading && <Row label="Mileage" value={data.mileage_reading} />}
              <Row label="Date" value={data.purchase_date} />
              {data.notes && <Row label="Notes" value={data.notes} />}
            </div>
            <div className="space-y-3">
              <button onClick={handleSubmit} className="btn-primary w-full">
                <Check size={20} /> Submit Expense
              </button>
              <button onClick={() => setStep(STEPS.DETAILS)} className="btn-ghost w-full">
                Edit Details
              </button>
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === STEPS.DONE && (
          <div className="flex flex-col items-center justify-center min-h-[70dvh] text-center">
            <div className="bg-emerald-500/20 rounded-full p-6 mb-6">
              <Check size={48} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Expense Saved!</h2>
            <p className="text-slate-400 mb-8">Your expense has been recorded successfully.</p>
            <div className="space-y-3 w-full">
              <button onClick={() => navigate('/')} className="btn-primary w-full">
                Back to Home
              </button>
              <button
                onClick={() => {
                  setData({
                    receipt_photo: null, category_id: null, category_name: '',
                    follow_up_type: 'none', vehicle_id: null, amount: '', description: '',
                    notes: '', mileage_reading: '',
                    purchase_date: new Date().toISOString().split('T')[0],
                    purchase_time: new Date().toTimeString().slice(0, 5)
                  });
                  setStep(STEPS.RECEIPT);
                }}
                className="btn-secondary w-full"
              >
                Add Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-slate-400 text-sm shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

function StepIndicator({ step, hasVehicle }) {
  const steps = ['receipt', 'category'];
  if (hasVehicle) steps.push('vehicle');
  steps.push('details', 'confirm');
  const idx = steps.indexOf(step);
  return (
    <div className="flex gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className={`h-1.5 w-6 rounded-full transition-all ${i <= idx ? 'bg-brand-400' : 'bg-slate-700'}`} />
      ))}
    </div>
  );
}
