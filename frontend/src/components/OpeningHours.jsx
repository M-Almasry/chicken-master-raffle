import React, { useState, useEffect } from 'react';
import { Clock, Save, X, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';

const DAYS = [
  { key: 'monday', label: 'الإثنين', labelEn: 'Monday' },
  { key: 'tuesday', label: 'الثلاثاء', labelEn: 'Tuesday' },
  { key: 'wednesday', label: 'الأربعاء', labelEn: 'Wednesday' },
  { key: 'thursday', label: 'الخميس', labelEn: 'Thursday' },
  { key: 'friday', label: 'الجمعة', labelEn: 'Friday' },
  { key: 'saturday', label: 'السبت', labelEn: 'Saturday' },
  { key: 'sunday', label: 'الأحد', labelEn: 'Sunday' },
];

const OpeningHours = ({ onClose, onSaved }) => {
  const [hours, setHours] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await api.get('/admin/opening-hours');
        if (res.data.success) {
          // Initialize with defaults for missing days
          const initialHours = {};
          DAYS.forEach(day => {
            initialHours[day.key] = res.data.data[day.key] || { open: '09:00', close: '23:00', closed: false };
          });
          setHours(initialHours);
        }
      } catch (err) {
        console.error('Error fetching opening hours:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHours();
  }, []);

  const handleChange = (day, field, value) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/opening-hours', { hours });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving opening hours:', err);
      alert('فشل حفظ ساعات الدوام');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="text-brand-gold animate-pulse font-bold">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-brand-dark border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-gold/20 text-brand-gold rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">إدارة ساعات الدوام</h2>
              <p className="text-gray-500 text-sm">حدد مواعيد الفتح والإغلاق لكل يوم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {DAYS.map((day) => (
            <div
              key={day.key}
              className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${hours[day.key]?.closed
                  ? 'bg-red-500/5 border-red-500/20 opacity-70'
                  : 'bg-gray-900/40 border-gray-800 hover:border-gray-700'
                }`}
            >
              <div className="flex items-center gap-4 min-w-[120px]">
                <button
                  onClick={() => handleChange(day.key, 'closed', !hours[day.key]?.closed)}
                  className={`p-2 rounded-xl transition-all ${hours[day.key]?.closed
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-800 text-gray-500 hover:text-white'
                    }`}
                  title={hours[day.key]?.closed ? 'فتح اليوم' : 'إغلاق اليوم'}
                >
                  {hours[day.key]?.closed ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <div className="font-bold text-gray-200">{day.label}</div>
              </div>

              {!hours[day.key]?.closed ? (
                <div className="flex items-center gap-4 flex-1 justify-end">
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">يفتح في</label>
                    <input
                      type="time"
                      value={hours[day.key]?.open || '09:00'}
                      onChange={(e) => handleChange(day.key, 'open', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all hover:bg-gray-700"
                    />
                  </div>
                  <div className="text-gray-700 mt-5">←</div>
                  <div className="flex flex-col">
                    <label className="text-[10px] text-gray-500 font-bold mb-1 uppercase tracking-wider">يغلق في</label>
                    <input
                      type="time"
                      value={hours[day.key]?.close || '23:00'}
                      onChange={(e) => handleChange(day.key, 'close', e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white text-sm outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all hover:bg-gray-700"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-right text-red-400 font-bold text-sm italic">
                  مغلق طوال اليوم
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800 bg-gray-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold text-gray-400 hover:bg-gray-800 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-2 bg-brand-gold hover:bg-yellow-500 text-brand-dark rounded-xl text-sm font-bold transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OpeningHours;
