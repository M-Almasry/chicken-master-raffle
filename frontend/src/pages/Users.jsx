import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Trash2,
  Key,
  X,
  Save,
  UserCircle
} from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const Users = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'admin'
  });

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      setAdmins(res.data.data);
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenModal = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setForm({
        username: admin.username,
        password: '',
        role: admin.role || 'receiver'
      });
    } else {
      setEditingAdmin(null);
      setForm({
        username: '',
        password: '',
        role: 'admin'
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        // Always send username and role explicitly so they're never falsy
        const payload = {
          username: form.username || editingAdmin.username,
          role: form.role || 'receiver',
          ...(form.password ? { password: form.password } : {})
        };
        await api.put(`/admin/users/${editingAdmin.id}`, payload);
      } else {
        await api.post('/admin/users', form);
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في حفظ البيانات');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المدير؟')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchAdmins();
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في الحذف');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-xs font-bold">
            <ShieldAlert size={14} /> مدير نظام
          </span>
        );
      case 'admin':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-brand-gold/10 text-brand-gold border border-brand-gold/20 rounded-full text-xs font-bold">
            <ShieldCheck size={14} /> مدير
          </span>
        );
      case 'receiver':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full text-xs font-bold">
            <Shield size={14} /> مستقبل طلبات
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-700 text-gray-400 border border-gray-600 rounded-full text-xs font-bold">
            <Shield size={14} /> {role}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-brand-dark p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
            <UsersIcon size={28} /> إدارة المدراء والصلاحيات
          </h1>
          <p className="text-gray-400 mt-1">إضافة موظفين للوحة التحكم وتحديد أدوارهم</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-brand-gold text-brand-dark rounded-xl shadow-lg shadow-brand-gold/10 hover:bg-yellow-500 transition-all font-bold transform hover:scale-105"
        >
          <UserPlus size={18} /> إضافة مدير جديد
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-500 animate-pulse">جاري جلب قائمة المدراء...</div>
        ) : admins.length > 0 ? (
          admins.map((admin) => (
            <div key={admin.id} className="bg-brand-dark rounded-2xl border border-gray-800 p-6 hover:border-brand-gold/50 transition-all relative group overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-gold/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-brand-gold/10 transition-all"></div>

              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-800 text-brand-gold shadow-inner">
                    <UserCircle size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">{admin.username}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      منذ: {admin.created_at && !isNaN(new Date(admin.created_at).getTime())
                        ? format(new Date(admin.created_at), 'yyyy/MM/dd')
                        : 'تاريخ غير معروف'}
                    </p>
                  </div>
                </div>
                {getRoleBadge(admin.role)}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(admin)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl hover:bg-brand-gold hover:text-brand-dark transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Edit size={16} /> تعديل
                </button>
                <button
                  disabled={admin.username === 'admin'}
                  onClick={() => handleDelete(admin.id)}
                  className="px-4 py-2.5 bg-gray-800 text-red-500/60 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 disabled:hover:bg-gray-800"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 bg-brand-dark border border-dashed border-gray-800 rounded-3xl text-center text-gray-500">
            لا يوجد مدراء آخرون حالياً.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-dark w-full max-w-md rounded-3xl border border-gray-800 p-8 relative animate-in zoom-in duration-200 shadow-2xl">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 left-6 text-gray-500 hover:text-white"><X /></button>
            <h2 className="text-2xl font-bold text-white mb-2 font-playfair">{editingAdmin ? 'تعديل بيانات المدير' : 'إضافة مدير جديد'}</h2>
            <p className="text-xs text-gray-500 mb-8 font-bold uppercase tracking-wider">يرجى تسجيل البيانات بدقة</p>

            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold pr-1">اسم المستخدم</label>
                <div className="relative">
                  <UserCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input
                    required
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-2xl py-3 pr-11 pl-4 focus:ring-1 focus:ring-brand-gold outline-none transition-all text-gray-200"
                    placeholder="مثلاً: ahmed_manager"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold pr-1">
                  كلمة المرور {editingAdmin && '(اتركها فارغة لعدم التغيير)'}
                </label>
                <div className="relative">
                  <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input
                    required={!editingAdmin}
                    type="password"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-2xl py-3 pr-11 pl-4 focus:ring-1 focus:ring-brand-gold outline-none transition-all text-gray-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2 uppercase font-bold pr-1">الدور / الصلاحية</label>
                <div className="relative">
                  <Shield className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <select
                    value={form.role}
                    onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-brand-charcoal border border-gray-700 rounded-2xl py-3 pr-11 pl-4 focus:ring-1 focus:ring-brand-gold outline-none appearance-none text-gray-200"
                  >
                    <option value="receiver">مستقبل الطلبات (ورديات فقط)</option>
                    <option value="admin">مدير (كامل الصلاحيات عدا المدراء)</option>
                    <option value="superadmin">مدير نظام (كامل الصلاحيات)</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-800 flex gap-3">
                <button type="submit" className="flex-1 py-4 bg-brand-gold text-brand-dark rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-xl shadow-brand-gold/20">
                  <Save size={20} /> {editingAdmin ? 'حفظ التعديلات' : 'إضافة المدير'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 bg-gray-800 text-white rounded-2xl font-bold hover:bg-gray-700 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
