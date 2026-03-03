import React, { useState, useEffect } from 'react';
import { Gift, Search, Filter, Trophy, UserCheck, UserX, Clock } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const Raffle = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState(null);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/registrations?status=${filter}&limit=100`);
      setRegistrations(res.data.data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [filter]);

  const handleDrawWinner = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إجراء السحب الآن؟ سيتم اختيار فائز عشوائي من المؤهلين.')) return;

    setDrawing(true);
    setWinner(null);
    try {
      const res = await api.post('/admin/draw-winner');
      if (res.data.success) {
        setWinner(res.data.winner);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'خطأ في إجراء السحب. تأكد من وجود متسابقين مؤهلين.');
    } finally {
      setDrawing(false);
    }
  };

  const filteredData = registrations.filter(reg =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.phone.includes(searchTerm) ||
    reg.coupon_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-brand-dark p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
            <Gift size={28} /> إدارة حملة السحب
          </h1>
          <p className="text-gray-400 mt-1">تتبع المسجلين وإجراء القرعة العشوائية للفوز بـ 100 شيكل</p>
        </div>

        <button
          onClick={handleDrawWinner}
          disabled={drawing}
          className={`flex items-center gap-2 px-6 py-3 bg-brand-gold text-brand-dark font-bold rounded-xl shadow-lg shadow-brand-gold/20 hover:bg-yellow-500 transition-all transform hover:scale-105 active:scale-95 ${drawing ? 'opacity-50 cursor-not-allowed animate-pulse' : ''}`}
        >
          <Trophy size={20} />
          {drawing ? 'جاري السحب...' : 'إجراء السحب الآن'}
        </button>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-brand-dark w-full max-w-md rounded-3xl border-2 border-brand-gold p-8 text-center relative overflow-hidden animate-in zoom-in duration-300">
            <div className="absolute top-0 left-0 w-full h-2 bg-brand-gold shadow-[0_0_20px_#D4A017]"></div>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center animate-bounce shadow-xl shadow-brand-gold/30">
                <Trophy size={40} className="text-brand-dark" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 font-playfair">ألف مبروك للفائز!</h2>
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-6">
              <p className="text-brand-gold text-xl font-bold mb-1">{winner.name}</p>
              <p className="text-gray-300 text-lg">{winner.phone}</p>
              <div className="mt-3 inline-block px-3 py-1 bg-brand-gold/10 text-brand-gold rounded-lg text-sm border border-brand-gold/20">
                كوبون: {winner.coupon_code}
              </div>
            </div>
            <button
              onClick={() => setWinner(null)}
              className="w-full py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors font-bold"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      )}

      {/* Stats & Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-brand-dark rounded-2xl border border-gray-800 overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-gray-800 bg-gray-900/50 flex flex-wrap gap-4 justify-between items-center">
            <div className="relative flex-1 min-w-[300px]">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="البحث بالاسم، الهاتف أو الكوبون..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 pr-10 pl-4 focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all text-sm"
              >
                <option value="">جميع الحالات</option>
                <option value="new">في انتظار التفعيل (غير مؤهل)</option>
                <option value="used">مفعل (مؤهل للسحب)</option>
                <option value="expired">منتهي الصلاحية</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-right">
              <thead className="text-gray-400 text-sm bg-gray-900/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 border-b border-gray-800">المشترك</th>
                  <th className="p-4 border-b border-gray-800 text-center">الكوبون</th>
                  <th className="p-4 border-b border-gray-800 text-center">تاريخ التسجيل</th>
                  <th className="p-4 border-b border-gray-800 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500 animate-pulse">جاري جلب المشتركين...</td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((reg) => (
                    <tr key={reg.id} className="hover:bg-gray-900/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{reg.name}</div>
                        <div className="text-gray-500 text-xs">{reg.phone}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-mono bg-gray-800 px-3 py-1 rounded text-xs text-brand-gold border border-gray-700">
                          {reg.coupon_code}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-400 text-xs">
                        <div className="flex items-center justify-center gap-1">
                          <Clock size={12} /> {format(new Date(reg.created_at), 'yyyy-MM-dd')}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center justify-center gap-1 w-max mx-auto ${reg.coupon_status === 'used' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                            reg.coupon_status === 'new' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                          {reg.coupon_status === 'used' ? <UserCheck size={12} /> : <Clock size={12} />}
                          {reg.coupon_status === 'used' ? 'مفعل ومؤهل' : reg.coupon_status === 'new' ? 'في انتظار طلب' : 'منتهي'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="p-12 text-center text-gray-500">لا يوجد مشتركين مطابقين للبحث.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-6">
          <div className="bg-brand-gold/10 p-6 rounded-2xl border border-brand-gold/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mb-4">
              <UserCheck size={32} className="text-brand-gold" />
            </div>
            <h3 className="text-lg font-bold text-brand-gold mb-1">المؤهلين للسحب</h3>
            <p className="text-3xl font-black text-white">{registrations.filter(r => r.coupon_status === 'used').length}</p>
            <p className="text-xs text-gray-400 mt-2 italic">هم المشتركين الذين قاموا بعمل طلب شراء وتم تفعيل كوبونهم تلقائياً.</p>
          </div>

          <div className="bg-brand-dark p-6 rounded-2xl border border-gray-800">
            <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-brand-gold" /> تلميحات الإدارة
            </h3>
            <ul className="text-xs text-gray-500 space-y-3 list-disc pr-4">
              <li>نظام السحب يختار عشوائياً من قاعدة البيانات.</li>
              <li>يمكنك فلترة القائمة لرؤية من لديهم كوبونات "جديدة" لم تستخدم بعد.</li>
              <li>عند الضغط على إجراء السحب، يظهر اسم الفائز فوراً لجميع الإدارة.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Activity = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default Raffle;
