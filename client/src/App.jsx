import { Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from './api';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import ExpenseFlow from './pages/ExpenseFlow';
import MileageEntry from './pages/MileageEntry';
import History from './pages/History';
import ExpenseDetail from './pages/ExpenseDetail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminCategories from './pages/AdminCategories';
import AdminVehicles from './pages/AdminVehicles';
import AdminEmailPresets from './pages/AdminEmailPresets';
import AdminSettings from './pages/AdminSettings';
import InstallPrompt from './components/InstallPrompt';

export default function App() {
  const [settings, setSettings] = useState({});
  const [adminPin, setAdminPin] = useState(null);

  useEffect(() => {
    api.getSettings().then(setSettings).catch(() => {});
  }, []);

  const refreshSettings = () => api.getSettings().then(setSettings);

  return (
    <div className="max-w-lg mx-auto relative">
      <InstallPrompt />
      <Routes>
        <Route path="/" element={<HomePage settings={settings} />} />
        <Route path="/expense" element={<ExpenseFlow settings={settings} />} />
        <Route path="/mileage" element={<MileageEntry settings={settings} />} />
        <Route path="/history" element={<History settings={settings} adminPin={adminPin} />} />
        <Route path="/expense/:id" element={<ExpenseDetail settings={settings} />} />
        <Route path="/admin" element={<AdminLogin onAuth={setAdminPin} />} />
        <Route path="/admin/dashboard" element={adminPin ? <AdminDashboard pin={adminPin} onLogout={() => setAdminPin(null)} /> : <Navigate to="/admin" />} />
        <Route path="/admin/categories" element={adminPin ? <AdminCategories pin={adminPin} /> : <Navigate to="/admin" />} />
        <Route path="/admin/vehicles" element={adminPin ? <AdminVehicles pin={adminPin} /> : <Navigate to="/admin" />} />
        <Route path="/admin/email" element={adminPin ? <AdminEmailPresets pin={adminPin} /> : <Navigate to="/admin" />} />
        <Route path="/admin/settings" element={adminPin ? <AdminSettings pin={adminPin} settings={settings} onSave={refreshSettings} /> : <Navigate to="/admin" />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
