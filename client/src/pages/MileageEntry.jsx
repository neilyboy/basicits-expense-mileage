import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Gauge, MapPin } from 'lucide-react';
import { api } from '../api';

export default function MileageEntry({ settings }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [step, setStep] = useState('vehicle'); // vehicle, entry, done
  const [lastMileage, setLastMileage] = useState(null);

  const [data, setData] = useState({
    vehicle_id: null,
    vehicle_label: '',
    date: new Date().toISOString().split('T')[0],
    start_mileage: '',
    end_mileage: '',
    notes: ''
  });

  useEffect(() => {
    api.getVehicles().then(v => {
      const mileageVehicles = v.filter(x => x.track_mileage);
      setVehicles(mileageVehicles);
      // Auto-select if only one mileage vehicle or configured default
      if (mileageVehicles.length === 1) {
        selectVehicle(mileageVehicles[0]);
      } else if (settings.mileage_vehicle_id) {
        const found = mileageVehicles.find(x => x.id === parseInt(settings.mileage_vehicle_id));
        if (found) selectVehicle(found);
      }
    });
  }, []);

  const selectVehicle = async (v) => {
    setData(prev => ({ ...prev, vehicle_id: v.id, vehicle_label: v.label }));
    try {
      const latest = await api.getLatestMileage(v.id);
      if (latest) {
        setLastMileage(latest);
        setData(prev => ({ ...prev, start_mileage: latest.end_mileage ? String(latest.end_mileage) : '' }));
      }
    } catch (e) {}
    setStep('entry');
  };

  const update = (fields) => setData(prev => ({ ...prev, ...fields }));

  const handleSubmit = async () => {
    try {
      await api.createMileage({
        vehicle_id: data.vehicle_id,
        date: data.date,
        start_mileage: data.start_mileage ? parseFloat(data.start_mileage) : null,
        end_mileage: data.end_mileage ? parseFloat(data.end_mileage) : null,
        notes: data.notes
      });
      setStep('done');
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const miles = data.start_mileage && data.end_mileage
    ? (parseFloat(data.end_mileage) - parseFloat(data.start_mileage)).toFixed(1)
    : null;

  return (
    <div className="page">
      <div className="page-header">
        <button onClick={() => step === 'vehicle' || step === 'done' ? navigate('/') : setStep('vehicle')} className="p-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold text-lg flex-1">Mileage Log</h1>
      </div>

      <div className="px-4 py-4">
        {step === 'vehicle' && (
          <div>
            <h2 className="text-2xl font-bold mb-1">Select Vehicle</h2>
            <p className="text-slate-400 text-sm mb-6">Which vehicle are you logging mileage for?</p>
            <div className="space-y-3">
              {vehicles.map(v => (
                <button
                  key={v.id}
                  onClick={() => selectVehicle(v)}
                  className="w-full card flex items-center gap-4 p-4 active:scale-[0.98] transition-all hover:border-emerald-500/50"
                >
                  <div className="bg-emerald-500/20 rounded-xl p-2.5">
                    <Gauge size={22} className="text-emerald-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold">{v.label}</p>
                    <p className="text-slate-400 text-xs">
                      {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                      {v.license_plate ? ` • ${v.license_plate}` : ''}
                    </p>
                  </div>
                </button>
              ))}
              {vehicles.length === 0 && (
                <div className="text-center py-12">
                  <Gauge size={48} className="text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">No vehicles configured for mileage tracking.</p>
                  <p className="text-slate-600 text-sm mt-1">Enable mileage tracking in Admin → Vehicles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'entry' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-500/20 rounded-xl p-2">
                <Gauge size={18} className="text-emerald-400" />
              </div>
              <span className="font-semibold">{data.vehicle_label}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Date</label>
                <input type="date" value={data.date} onChange={e => update({ date: e.target.value })} />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Starting Mileage</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Odometer start"
                  value={data.start_mileage}
                  onChange={e => update({ start_mileage: e.target.value })}
                />
                {lastMileage && (
                  <p className="text-xs text-slate-500 mt-1">
                    Last reading: {lastMileage.end_mileage || lastMileage.start_mileage} on {lastMileage.date}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Ending Mileage</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="Odometer end"
                  value={data.end_mileage}
                  onChange={e => update({ end_mileage: e.target.value })}
                />
              </div>

              {miles && parseFloat(miles) > 0 && (
                <div className="card bg-emerald-500/10 border-emerald-500/30 flex items-center gap-3">
                  <MapPin size={18} className="text-emerald-400" />
                  <span className="text-emerald-300 font-semibold">{miles} miles driven</span>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400 mb-1 block">Notes / Destinations</label>
                <textarea
                  rows={3}
                  placeholder="Where did you travel today?"
                  value={data.notes}
                  onChange={e => update({ notes: e.target.value })}
                  className="bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <button onClick={handleSubmit} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25">
                <Check size={20} /> Save Mileage
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center min-h-[70dvh] text-center">
            <div className="bg-emerald-500/20 rounded-full p-6 mb-6">
              <Check size={48} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Mileage Saved!</h2>
            {miles && <p className="text-emerald-400 font-semibold mb-1">{miles} miles logged</p>}
            <p className="text-slate-400 mb-8">Entry recorded for {data.date}</p>
            <div className="space-y-3 w-full">
              <button onClick={() => navigate('/')} className="btn-primary w-full bg-emerald-600 hover:bg-emerald-500">
                Back to Home
              </button>
              <button
                onClick={() => {
                  setData(prev => ({
                    ...prev,
                    start_mileage: data.end_mileage || '',
                    end_mileage: '',
                    notes: '',
                    date: new Date().toISOString().split('T')[0]
                  }));
                  setStep('entry');
                }}
                className="btn-secondary w-full"
              >
                Add Another Entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
