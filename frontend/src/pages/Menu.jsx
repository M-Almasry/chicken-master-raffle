import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Save,
  X,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  Check
} from 'lucide-react';
import api from '../utils/api';

const Menu = () => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [itemForm, setItemForm] = useState({
    name_ar: '', name_en: '', description_ar: '', description_en: '',
    price: '', discount_price: '', category_id: '', image_url: '', is_available: true
  });
  const [categoryForm, setCategoryForm] = useState({
    name_ar: '', name_en: '', sort_order: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catsRes, itemsRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/items')
      ]);
      setCategories(catsRes.data.data);
      setItems(itemsRes.data.data);
      if (catsRes.data.data.length > 0 && !activeCategory) {
        setActiveCategory(catsRes.data.data[0].id);
      }
    } catch (err) {
      console.error('Error fetching menu data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAvailability = async (item) => {
    try {
      const updatedStatus = !item.is_available;
      await api.put(`/admin/items/${item.id}`, { ...item, is_available: updatedStatus });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: updatedStatus } : i));
    } catch (err) {
      alert('خطأ في تحديث الحالة');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الصنف؟')) return;
    try {
      await api.delete(`/admin/items/${id}`);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      alert('خطأ في الحذف');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/admin/items/${editingItem.id}`, itemForm);
      } else {
        await api.post('/admin/items', itemForm);
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (err) {
      alert('خطأ في الحفظ');
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/admin/categories/${editingCategory.id}`, categoryForm);
      } else {
        await api.post('/admin/categories', categoryForm);
      }
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (err) {
      alert('خطأ في حفظ التصنيف');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('حذف التصنيف سيؤدي لمسح جميع الأصناف داخله. هل أنت متأكد؟')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      setCategories(prev => prev.filter(c => c.id !== id));
      setActiveCategory(categories[0]?.id || null);
    } catch (err) {
      alert('خطأ في حذف التصنيف');
    }
  };

  const openItemModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setItemForm({ ...item });
    } else {
      setEditingItem(null);
      setItemForm({
        name_ar: '', name_en: '', description_ar: '', description_en: '',
        price: '', discount_price: '', category_id: activeCategory || '', image_url: '', is_available: true
      });
    }
    setIsItemModalOpen(true);
  };

  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({ ...cat });
    } else {
      setEditingCategory(null);
      setCategoryForm({ name_ar: '', name_en: '', sort_order: categories.length });
    }
    setIsCategoryModalOpen(true);
  };

  const filteredItems = items.filter(i => i.category_id === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-brand-dark p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
            <UtensilsCrossed size={28} /> قائمة الطعام
          </h1>
          <p className="text-gray-400 mt-1">إدارة الأصناف، الأسعار والتصنيفات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => openCategoryModal()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 border border-gray-700 rounded-xl hover:bg-gray-700 transition-all font-bold text-sm"
          >
            <Plus size={16} /> تصنيف جديد
          </button>
          <button
            onClick={() => openItemModal()}
            className="flex items-center gap-2 px-6 py-2 bg-brand-gold text-brand-dark rounded-xl shadow-lg shadow-brand-gold/10 hover:bg-yellow-500 transition-all font-bold text-sm transform hover:scale-105"
          >
            <PlusCircle size={18} /> إضافة صنف
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Sidebar: Categories */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-brand-dark rounded-2xl border border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-300 text-sm uppercase tracking-wider">التصنيفات</h3>
            </div>
            <div className="p-2 space-y-1 max-h-[500px] overflow-y-auto custom-scrollbar">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${activeCategory === cat.id ? 'bg-brand-gold text-brand-dark' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <span className="font-bold">{cat.name_ar}</span>
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${activeCategory === cat.id ? 'opacity-100' : ''}`}>
                    <button
                      onClick={(e) => { e.stopPropagation(); openCategoryModal(cat); }}
                      className={`p-1 rounded-lg ${activeCategory === cat.id ? 'hover:bg-black/10' : 'hover:bg-gray-700'}`}
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                      className={`p-1 rounded-lg ${activeCategory === cat.id ? 'hover:bg-black/10' : 'hover:bg-red-500/20 text-red-400'}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && <p className="p-4 text-center text-gray-600 text-xs">لا يوجد تصنيفات</p>}
            </div>
          </div>
        </div>

        {/* Content: Items Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full p-20 text-center text-gray-500 animate-pulse">جاري تحميل القائمة...</div>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <div key={item.id} className="bg-brand-dark rounded-2xl border border-gray-800 overflow-hidden group hover:border-brand-gold/50 transition-all flex flex-col h-full">
                  <div className="aspect-video bg-gray-900 relative flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name_ar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <ImageIcon className="text-gray-700" size={40} />
                    )}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs font-bold text-brand-gold border border-brand-gold/30">
                      ₪{item.price}
                    </div>
                    {!item.is_available && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="px-4 py-1.5 bg-red-600 text-white font-bold rounded-full text-xs uppercase tracking-widest border border-white/20">غير متوفر</span>
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`text-lg font-bold ${item.is_available ? 'text-white' : 'text-gray-500'}`}>{item.name_ar}</h4>
                      <span className="text-xs text-gray-500 font-mono">#{item.id}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{item.description_ar}</p>

                    <div className="mt-auto pt-4 border-t border-gray-800 flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openItemModal(item)}
                          className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-brand-gold hover:text-brand-dark transition-all"
                          title="تعديل"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 bg-gray-800 text-gray-400 rounded-lg hover:bg-red-500/20 hover:text-red-500 transition-all"
                          title="حذف"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${item.is_available ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-gray-800'}`}
                      >
                        {item.is_available ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                        {item.is_available ? 'متوفر' : 'معطل'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full bg-brand-dark border border-gray-800 border-dashed rounded-3xl p-20 flex flex-col items-center text-center opacity-50">
                <UtensilsCrossed size={60} className="text-gray-700 mb-4" />
                <p className="text-gray-500">لَا يُوجد أصناف في هذا التصنيف حالياً.</p>
                <button onClick={() => openItemModal()} className="mt-4 text-brand-gold hover:underline text-sm font-bold">أضف أول صنف الآن</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-dark w-full max-w-2xl rounded-3xl border border-gray-800 p-8 relative animate-in zoom-in duration-200 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={() => setIsItemModalOpen(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6 font-playfair">{editingItem ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h2>

            <form onSubmit={handleSaveItem} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">الاسم (عربي)</label>
                  <input required value={itemForm.name_ar} onChange={e => setItemForm({ ...itemForm, name_ar: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none" placeholder="مثلاً: دجاج مشوي" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">الاسم (English)</label>
                  <input required value={itemForm.name_en} onChange={e => setItemForm({ ...itemForm, name_en: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none" placeholder="Example: Grilled Chicken" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">السعر (₪)</label>
                    <input required type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">السعر المخفض</label>
                    <input type="number" step="0.01" value={itemForm.discount_price} onChange={e => setItemForm({ ...itemForm, discount_price: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">رابط الصورة</label>
                  <input value={itemForm.image_url} onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">التصنيف</label>
                  <select required value={itemForm.category_id} onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none">
                    <option value="">اختر تصنيف...</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name_ar}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">الوصف (عربي)</label>
                  <textarea rows="2" value={itemForm.description_ar} onChange={e => setItemForm({ ...itemForm, description_ar: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none resize-none"></textarea>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">الوصف (English)</label>
                  <textarea rows="2" value={itemForm.description_en} onChange={e => setItemForm({ ...itemForm, description_en: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold outline-none resize-none"></textarea>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-gray-300 font-bold text-sm">حالة التوفر فوراً:</span>
                  <button
                    type="button"
                    onClick={() => setItemForm({ ...itemForm, is_available: !itemForm.is_available })}
                    className={`flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all ${itemForm.is_available ? 'text-green-500 bg-green-500/10' : 'text-gray-500 bg-gray-800'}`}
                  >
                    {itemForm.is_available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    {itemForm.is_available ? 'متاح للطلب' : 'معطل'}
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 pt-6 border-t border-gray-800 flex gap-3">
                <button type="submit" className="flex-1 py-4 bg-brand-gold text-brand-dark rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-xl shadow-brand-gold/10">
                  <Save size={20} /> {editingItem ? 'حفظ التعديلات' : 'إضافة الصنف للقائمة'}
                </button>
                <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-8 py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-700 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-dark w-full max-w-md rounded-3xl border border-gray-800 p-8 relative animate-in zoom-in duration-200">
            <button onClick={() => setIsCategoryModalOpen(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-6 font-playfair">{editingCategory ? 'تعديل التصنيف' : 'تصنيف جديد'}</h2>

            <form onSubmit={handleSaveCategory} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">اسم التصنيف (عربي)</label>
                <input required value={categoryForm.name_ar} onChange={e => setCategoryForm({ ...categoryForm, name_ar: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-gold outline-none" placeholder="مثلاً: وجبات عائلية" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">اسم التصنيف (English)</label>
                <input required value={categoryForm.name_en} onChange={e => setCategoryForm({ ...categoryForm, name_en: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-gold outline-none" placeholder="Example: Family Meals" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-2 uppercase font-bold pr-1">الترتيب</label>
                <input type="number" value={categoryForm.sort_order} onChange={e => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-gold outline-none" />
              </div>

              <div className="pt-6 border-t border-gray-800 flex gap-3">
                <button type="submit" className="flex-1 py-4 bg-brand-gold text-brand-dark rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all">
                  <Save size={20} /> {editingCategory ? 'تعديل' : 'إنشاء'}
                </button>
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-8 py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-700 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;
