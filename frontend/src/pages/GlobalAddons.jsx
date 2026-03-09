import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Save, X, Layers } from 'lucide-react';
import api from '../utils/api';

const GlobalAddons = ({ onClose }) => {
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);

  const [form, setForm] = useState({
    name_ar: '',
    name_en: '',
    price: '',
    is_available: true
  });

  const fetchAddons = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/global-addons');
      setAddons(res.data.data);
    } catch (err) {
      console.error('Error fetching addons:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddons();
  }, []);

  const handleToggleAvailability = async (addon) => {
    try {
      const updatedStatus = !addon.is_available;
      await api.put(`/admin/global-addons/${addon.id}`, { ...addon, is_available: updatedStatus });
      setAddons(prev => prev.map(a => a.id === addon.id ? { ...a, is_available: updatedStatus } : a));
    } catch (err) {
      alert('خطأ في تحديث الحالة');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الإضافة؟')) return;
    try {
      await api.delete(`/admin/global-addons/${id}`);
      setAddons(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('خطأ في الحذف');
    }
  };

  const openModal = (addon = null) => {
    if (addon) {
      setEditingAddon(addon);
      setForm({ ...addon });
    } else {
      setEditingAddon(null);
      setForm({ name_ar: '', name_en: '', price: '', is_available: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAddon(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAddon) {
        await api.put(`/admin/global-addons/${editingAddon.id}`, form);
      } else {
        await api.post('/admin/global-addons', form);
      }
      closeModal();
      fetchAddons();
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ. تأكد من إدخال البيانات بشكل صحيح.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-brand-dark w-full max-w-5xl rounded-3xl border border-gray-800 p-8 relative animate-in zoom-in duration-200 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar space-y-6">
        <button onClick={onClose} className="absolute top-6 left-6 text-gray-500 hover:text-white transition-colors">
          <X size={24} />
        </button>

        <div className="flex flex-wrap justify-between items-center gap-4 bg-gray-900/50 p-6 rounded-2xl border border-gray-800">
          <div>
            <h2 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
              <Layers size={28} /> الإضافات العامة
            </h2>
            <p className="text-gray-400 mt-1">إدارة الإضافات التي تظهر لجميع الوجبات (مثل المشروبات والصلصات)</p>
          </div>
          <button
            onClick={() => openModal()}
            className="bg-brand-gold text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-yellow-500 transition-colors shadow-lg shadow-brand-gold/20"
          >
            <Plus size={20} /> إضافة صنف
          </button>
        </div>

        <div className="bg-gray-900/40 rounded-2xl border border-gray-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-gray-900/80 border-b border-gray-800 text-gray-400 text-sm">
                <tr>
                  <th className="p-4 font-semibold">الاسم (العربية)</th>
                  <th className="p-4 font-semibold">الاسم (English)</th>
                  <th className="p-4 font-semibold">السعر (₪)</th>
                  <th className="p-4 font-semibold">الحالة</th>
                  <th className="p-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">جاري التحميل...</td>
                  </tr>
                ) : addons.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-500">لا توجد إضافات حالياً. أضف الأولى!</td>
                  </tr>
                ) : (
                  addons.map(addon => (
                    <tr key={addon.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="p-4 font-bold text-white">{addon.name_ar}</td>
                      <td className="p-4 text-gray-400">{addon.name_en || '-'}</td>
                      <td className="p-4 font-mono font-bold text-brand-gold">{addon.price}</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleAvailability(addon)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${addon.is_available ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
                        >
                          {addon.is_available ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                          {addon.is_available ? 'متاح' : 'غير متاح'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openModal(addon)}
                            className="p-2 bg-blue-600/10 text-blue-500 rounded-lg hover:bg-blue-600/20 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(addon.id)}
                            className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Existing child modal for adding/editing an addon */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-brand-dark border border-brand-gold rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b border-gray-800 bg-gray-900/30">
                <h2 className="text-xl font-bold font-playfair text-brand-gold flex items-center gap-2">
                  <Settings className="text-brand-gold" size={24} />
                  {editingAddon ? 'تعديل الإضافة' : 'إضافة جديدة'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors bg-gray-800 rounded-full p-1 border border-gray-700">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">الاسم (العربية) <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                    placeholder="مثال: كوكا كولا"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">الاسم (English)</label>
                  <input
                    type="text"
                    value={form.name_en || ''}
                    onChange={(e) => setForm({ ...form, name_en: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors"
                    placeholder="e.g. Coca Cola"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">السعر (₪) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-colors text-left"
                    placeholder="0.00"
                    dir="ltr"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.is_available}
                      onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    <span className="mr-3 text-sm font-medium text-gray-300">متاح للطلب</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-gray-800">
                  <button
                    type="submit"
                    className="w-full bg-brand-gold text-black rounded-xl py-3 font-bold hover:bg-yellow-500 transition-colors flex justify-center items-center gap-2 shadow-lg shadow-brand-gold/20"
                  >
                    <Save size={20} />
                    {editingAddon ? 'حفظ التعديلات' : 'إضافة'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GlobalAddons;
