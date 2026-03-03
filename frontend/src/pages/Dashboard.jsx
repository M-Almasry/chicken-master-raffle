import React, { useEffect, useState } from 'react';
import { Users, ShoppingBag, DollarSign, Activity, PackageCheck, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import api from '../utils/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [shopStatus, setShopStatus] = useState({ is_open: true, mode: 'auto', message: '' });
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, topItemsRes, ordersRes, statusRes, feeRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/top-items'),
        api.get('/admin/orders?limit=10'),
        api.get('/admin/shop-status'),
        api.get('/admin/delivery-fee')
      ]);

      setStats(statsRes.data.data);
      setTopItems(topItemsRes.data.data);
      setRecentOrders(ordersRes.data.data);
      setShopStatus(statusRes.data);
      setDeliveryFee(feeRes.data.data.amount || 0);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (updates) => {
    setUpdateLoading(true);
    try {
      const newStatus = { ...shopStatus, ...updates };
      await api.put('/admin/shop-status', newStatus);
      setShopStatus(newStatus);
    } catch (err) {
      console.error('Error updating shop status:', err);
      alert('فشل تحديث حالة المحل');
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateDeliveryFee = async () => {
    setUpdateLoading(true);
    try {
      await api.put('/admin/delivery-fee', { amount: deliveryFee });
      alert('تم تحديث رسوم التوصيل بنجاح');
    } catch (err) {
      console.error('Error updating delivery fee:', err);
      alert('فشل تحديث رسوم التوصيل');
    } finally {
      setUpdateLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 15 seconds for live orders
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400">جاري تحميل البيانات...</div>;

  const statCards = [
    { label: 'صافي المبيعات (بدون التوصيل)', value: `₪${stats?.total_revenue || 0}`, icon: <DollarSign size={24} className="text-green-500" /> },
    { label: 'إجمالي الطلبات', value: stats?.total_orders || 0, icon: <ShoppingBag size={24} className="text-blue-500" /> },
    { label: 'الطلبات المكتملة', value: stats?.completed_orders || 0, icon: <PackageCheck size={24} className="text-purple-500" /> },
    { label: 'طلبات قيد الانتظار', value: stats?.pending_orders || 0, icon: <Activity size={24} className="text-yellow-500" /> },
    { label: 'إجمالي المسجلين (سحب)', value: stats?.total_registrations || 0, icon: <Users size={24} className="text-brand-gold" /> },
  ];

  // Prepare chart data from top items
  const chartData = topItems.map(item => ({
    name: item.name_ar,
    مبيعات: parseInt(item.total_sold, 10)
  }));

  return (
    <div className="space-y-6">
      {/* Shop Control Bar */}
      <div className="bg-brand-dark p-4 rounded-2xl border border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${shopStatus.is_open ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            <Activity size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-400">حالة المتجر الحالية</h2>
            <p className="text-white font-bold flex items-center gap-2">
              {shopStatus.is_open ? 'مفتوح الآن' : 'مغلق الآن'}
              <span className="text-xs font-normal text-gray-500">({shopStatus.mode === 'auto' ? 'تلقائي' : 'يدوي'})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            disabled={updateLoading}
            onClick={() => handleUpdateStatus({ mode: 'open', is_open: true })}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${shopStatus.mode === 'open' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            فتح يدوي
          </button>
          <button
            disabled={updateLoading}
            onClick={() => handleUpdateStatus({ mode: 'closed', is_open: false })}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${shopStatus.mode === 'closed' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            إغلاق يدوي
          </button>
          <button
            disabled={updateLoading}
            onClick={() => handleUpdateStatus({ mode: 'auto' })}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${shopStatus.mode === 'auto' ? 'bg-brand-gold text-brand-dark' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            جدول تلقائي
          </button>
        </div>

        {/* Delivery Fee Setting */}
        <div className="flex items-center gap-3 border-r border-gray-800 pr-4">
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-bold mb-1">رسوم التوصيل (₪)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(e.target.value)}
                className="w-20 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:ring-1 focus:ring-brand-gold outline-none"
              />
              <button
                onClick={handleUpdateDeliveryFee}
                disabled={updateLoading}
                className="p-1 px-3 bg-brand-gold text-brand-dark rounded-lg text-xs font-bold hover:bg-yellow-500 transition-all disabled:opacity-50"
              >
                {updateLoading ? '...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-playfair text-brand-gold">لوحة القيادة الرئيسية</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          تحديث حي نشط
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-brand-dark p-6 rounded-2xl border border-gray-800 flex items-center gap-4 hover:border-brand-gold/50 transition-colors">
            <div className="p-3 bg-gray-900 rounded-xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-400 text-sm font-semibold">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-1 text-white">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Live Orders & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Live Orders Widget */}
        <div className="lg:col-span-2 bg-brand-dark p-6 rounded-2xl border border-gray-800 flex flex-col h-[500px]">
          <h2 className="text-xl font-bold text-brand-gold mb-4 flex items-center gap-2">
            <Activity size={20} /> أحدث الطلبات
          </h2>
          <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
            <table className="w-full text-right text-sm">
              <thead className="text-gray-400 sticky top-0 bg-brand-dark z-10">
                <tr>
                  <th className="pb-3 border-b border-gray-800">رقم الطلب</th>
                  <th className="pb-3 border-b border-gray-800">العميل</th>
                  <th className="pb-3 border-b border-gray-800">المبلغ</th>
                  <th className="pb-3 border-b border-gray-800">الحالة</th>
                  <th className="pb-3 border-b border-gray-800">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-900/50 transition-colors border-b border-gray-800/50">
                    <td className="py-3 items-center gap-2">
                      <span className="bg-gray-800 px-2 py-1 rounded text-xs font-mono">#{order.id}</span>
                    </td>
                    <td className="py-3 font-semibold">{order.customer_name}</td>
                    <td className="py-3 text-green-400 font-bold">₪{order.total_after_discount}</td>
                    <td className="py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                        order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                        {order.status === 'completed' ? 'مكتمل' : order.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 text-xs">
                      {format(new Date(order.created_at), 'hh:mm a')}
                    </td>
                  </tr>
                ))}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500">لا يوجد طلبات حديثة</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Items List */}
        <div className="bg-brand-dark p-6 rounded-2xl border border-gray-800 flex flex-col h-[500px]">
          <h2 className="text-xl font-bold text-brand-gold mb-4 flex items-center gap-2">
            <Star size={20} /> الأصناف المشتعلة (الأكثر طلباً)
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {topItems.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index < 3 ? 'bg-brand-gold text-brand-dark' : 'bg-gray-800 text-gray-400'}`}>
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-200">{item.name_ar}</h4>
                    <p className="text-xs text-gray-500">{item.category_name}</p>
                  </div>
                </div>
                <div className="text-brand-gold font-bold">
                  {item.total_sold} <span className="text-xs text-gray-500 font-normal">طبق</span>
                </div>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-center text-gray-500 mt-10">لَم تُسجل مبيعات بعد.</p>}
          </div>
        </div>

      </div>

      {/* Sales Chart */}
      <div className="bg-brand-dark p-6 rounded-2xl border border-gray-800 h-[450px] flex flex-col">
        <h2 className="text-xl font-bold text-brand-gold mb-6">مبيعات الأصناف (كمية الأطباق المباعة)</h2>
        <div className="w-full h-[300px]">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} angle={-25} textAnchor="end" height={60} />
                <YAxis stroke="#888" tick={{ fill: '#888' }} />
                <Tooltip
                  cursor={{ fill: '#333' }}
                  contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#D4A017', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#D4A017', fontWeight: 'bold' }}
                />
                <Bar dataKey="مبيعات" fill="#D4A017" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">لا توجد بيانات مبيعات حالياً</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
