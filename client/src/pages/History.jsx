import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Filter, FileDown, ChevronRight, Receipt, Gauge, DollarSign } from 'lucide-react';
import { api } from '../api';
import { generateExpenseReportPDF, generateMileageReportPDF, generateCombinedReportPDF } from '../utils/pdf';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays } from 'date-fns';

const PRESETS = [
  { label: 'This Week', fn: () => ({ start: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'), end: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd') }) },
  { label: 'Last 7 Days', fn: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This Month', fn: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'This Quarter', fn: () => ({ start: format(startOfQuarter(new Date()), 'yyyy-MM-dd'), end: format(endOfQuarter(new Date()), 'yyyy-MM-dd') }) },
  { label: 'This Year', fn: () => ({ start: format(startOfYear(new Date()), 'yyyy-MM-dd'), end: format(endOfYear(new Date()), 'yyyy-MM-dd') }) },
  { label: 'All Time', fn: () => ({ start: '', end: '' }) }
];

export default function History({ settings }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('expenses');
  const [expenses, setExpenses] = useState([]);
  const [mileage, setMileage] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activePreset, setActivePreset] = useState('All Time');
  const [loading, setLoading] = useState(false);

  const fetchData = async (range) => {
    setLoading(true);
    try {
      const params = {};
      if (range.start) params.start = range.start;
      if (range.end) params.end = range.end;
      const [exp, mil] = await Promise.all([
        api.getExpenses(params),
        api.getMileage(params)
      ]);
      setExpenses(exp);
      setMileage(mil);
    } catch (e) {}
    setLoading(false);
  };

  useEffect(() => { fetchData(dateRange); }, []);

  const applyPreset = (preset) => {
    const range = preset.fn();
    setDateRange(range);
    setActivePreset(preset.label);
    fetchData(range);
    setShowFilter(false);
  };

  const applyCustomRange = () => {
    setActivePreset('Custom');
    fetchData(dateRange);
    setShowFilter(false);
  };

  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalMiles = mileage.reduce((s, m) => {
    if (m.start_mileage != null && m.end_mileage != null) return s + (m.end_mileage - m.start_mileage);
    return s;
  }, 0);

  const handleExport = async (type) => {
    setShowExport(false);
    const companyName = settings.company_name || 'Basic ITS';
    const range = { start: dateRange.start, end: dateRange.end, label: activePreset };
    try {
      if (type === 'expenses') {
        await generateExpenseReportPDF(expenses, companyName, range);
      } else if (type === 'mileage') {
        await generateMileageReportPDF(mileage, companyName, range);
      } else {
        await generateCombinedReportPDF(expenses, mileage, companyName, range);
      }
    } catch (err) {
      alert('PDF generation failed: ' + err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">History</h1>
        <button onClick={() => setShowFilter(!showFilter)} className="p-2 rounded-xl bg-slate-800">
          <Filter size={18} />
        </button>
        <button onClick={() => setShowExport(!showExport)} className="p-2 rounded-xl bg-slate-800">
          <FileDown size={18} />
        </button>
      </div>

      {/* Date Filter Panel */}
      {showFilter && (
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 space-y-3">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activePreset === p.label ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-xs text-slate-500">From</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="text-sm py-2" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-slate-500">To</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="text-sm py-2" />
            </div>
            <button onClick={applyCustomRange} className="btn-primary py-2 px-4 text-sm">Go</button>
          </div>
        </div>
      )}

      {/* Export Panel */}
      {showExport && (
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 space-y-2">
          <p className="text-xs text-slate-400 font-medium uppercase">Export PDF Report</p>
          <div className="flex gap-2">
            <button onClick={() => handleExport('expenses')} className="btn-secondary flex-1 py-2 text-sm">Expenses</button>
            <button onClick={() => handleExport('mileage')} className="btn-secondary flex-1 py-2 text-sm">Mileage</button>
            <button onClick={() => handleExport('combined')} className="btn-primary flex-1 py-2 text-sm">Combined</button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex gap-3">
          <div className="flex-1 card bg-brand-600/10 border-brand-500/20 text-center py-3">
            <DollarSign size={18} className="text-brand-400 mx-auto mb-1" />
            <p className="text-xl font-bold">${totalExpenses.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 uppercase">{expenses.length} Expenses</p>
          </div>
          <div className="flex-1 card bg-emerald-600/10 border-emerald-500/20 text-center py-3">
            <Gauge size={18} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold">{totalMiles.toFixed(1)}</p>
            <p className="text-[10px] text-slate-400 uppercase">{mileage.length} Entries</p>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-2">{activePreset}</p>
      </div>

      {/* Tabs */}
      <div className="px-4 flex gap-1 mb-3">
        <button
          onClick={() => setTab('expenses')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'expenses' ? 'bg-brand-500 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Expenses
        </button>
        <button
          onClick={() => setTab('mileage')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${tab === 'mileage' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}
        >
          Mileage
        </button>
      </div>

      {/* List */}
      <div className="px-4 space-y-2 pb-4">
        {loading && <p className="text-slate-500 text-center py-8">Loading...</p>}

        {!loading && tab === 'expenses' && expenses.map(e => (
          <button
            key={e.id}
            onClick={() => navigate(`/expense/${e.id}`)}
            className="w-full card flex items-center gap-3 p-3 active:scale-[0.98] transition-all"
          >
            <span className="text-2xl">{e.category_icon || '📋'}</span>
            <div className="text-left flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{e.category_name || 'Uncategorized'}</p>
              <p className="text-xs text-slate-400 truncate">{e.description || 'No description'}</p>
              <p className="text-[10px] text-slate-500">{e.purchase_date}</p>
            </div>
            {e.receipt_photo && <Receipt size={14} className="text-slate-600 shrink-0" />}
            {e.amount && <span className="font-semibold text-sm">${parseFloat(e.amount).toFixed(2)}</span>}
            <ChevronRight size={16} className="text-slate-600 shrink-0" />
          </button>
        ))}

        {!loading && tab === 'mileage' && mileage.map(m => (
          <div key={m.id} className="card p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{m.vehicle_label || 'Vehicle'}</span>
              <span className="text-[10px] text-slate-500">{m.date}</span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {m.start_mileage != null && <span className="text-slate-400">Start: {m.start_mileage}</span>}
              {m.end_mileage != null && <span className="text-slate-400">End: {m.end_mileage}</span>}
              {m.start_mileage != null && m.end_mileage != null && (
                <span className="text-emerald-400 font-semibold">{(m.end_mileage - m.start_mileage).toFixed(1)} mi</span>
              )}
            </div>
            {m.notes && <p className="text-xs text-slate-500 mt-1">{m.notes}</p>}
          </div>
        ))}

        {!loading && tab === 'expenses' && expenses.length === 0 && (
          <p className="text-slate-500 text-center py-12">No expenses found for this period.</p>
        )}
        {!loading && tab === 'mileage' && mileage.length === 0 && (
          <p className="text-slate-500 text-center py-12">No mileage entries found for this period.</p>
        )}
      </div>
    </div>
  );
}
