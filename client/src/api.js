const BASE = '';

async function request(path, options = {}) {
  const { headers: extraHeaders, ...rest } = options;
  const res = await fetch(`${BASE}${path}`, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

function withPin(pin) {
  return { 'X-Admin-Pin': pin };
}

export const api = {
  // Settings
  getSettings: () => request('/api/settings'),
  updateSettings: (pin, data) => request('/api/settings', { method: 'PUT', body: JSON.stringify(data), headers: withPin(pin) }),
  verifyPin: (pin) => request('/api/admin/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) }),

  // Categories
  getCategories: () => request('/api/categories'),
  getAllCategories: (pin) => request('/api/categories/all', { headers: withPin(pin) }),
  createCategory: (pin, data) => request('/api/categories', { method: 'POST', body: JSON.stringify(data), headers: withPin(pin) }),
  updateCategory: (pin, id, data) => request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: withPin(pin) }),
  deleteCategory: (pin, id) => request(`/api/categories/${id}`, { method: 'DELETE', headers: withPin(pin) }),

  // Vehicles
  getVehicles: () => request('/api/vehicles'),
  getAllVehicles: (pin) => request('/api/vehicles/all', { headers: withPin(pin) }),
  createVehicle: (pin, data) => request('/api/vehicles', { method: 'POST', body: JSON.stringify(data), headers: withPin(pin) }),
  updateVehicle: (pin, id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: withPin(pin) }),
  deleteVehicle: (pin, id) => request(`/api/vehicles/${id}`, { method: 'DELETE', headers: withPin(pin) }),

  // Expenses
  getExpenses: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/expenses${qs ? '?' + qs : ''}`);
  },
  getExpense: (id) => request(`/api/expenses/${id}`),
  createExpense: (data) => request('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) => request(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (pin, id) => request(`/api/expenses/${id}`, { method: 'DELETE', headers: withPin(pin) }),

  // Mileage
  getMileage: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/mileage${qs ? '?' + qs : ''}`);
  },
  createMileage: (data) => request('/api/mileage', { method: 'POST', body: JSON.stringify(data) }),
  updateMileage: (id, data) => request(`/api/mileage/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMileage: (pin, id) => request(`/api/mileage/${id}`, { method: 'DELETE', headers: withPin(pin) }),
  getLatestMileage: (vehicleId) => request(`/api/mileage/latest/${vehicleId}`),

  // Email presets
  getEmailPresets: () => request('/api/email-presets'),
  createEmailPreset: (pin, data) => request('/api/email-presets', { method: 'POST', body: JSON.stringify(data), headers: withPin(pin) }),
  updateEmailPreset: (pin, id, data) => request(`/api/email-presets/${id}`, { method: 'PUT', body: JSON.stringify(data), headers: withPin(pin) }),
  deleteEmailPreset: (pin, id) => request(`/api/email-presets/${id}`, { method: 'DELETE', headers: withPin(pin) }),

  // Stats
  getStats: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/stats${qs ? '?' + qs : ''}`);
  },

  // Upload
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const res = await fetch(`${BASE}/api/upload`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return res.json();
  }
};
