import React, { useState, useEffect } from 'react';
import { ShoppingBag, Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, Phone, User, Receipt } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/orders?status=${filter}&limit=50`);
      setOrders(res.data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // Simple polling
    return () => clearInterval(interval);
  }, [filter]);

  const handleUpdateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/admin/orders/${id}/status`, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
    } catch (err) {
      alert('خطأ في تحديث الحالة');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm) ||
    order.id.toString().includes(searchTerm)
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return 'قيد الانتظار';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-brand-dark p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
            <ShoppingBag size={28} /> إدارة الطلبات
          </h1>
          <p className="text-gray-400 mt-1">مراقبة الطلبات المباشرة وتحديث حالاتها</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[250px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input
              type="text"
              placeholder="ابحث بالاسم، الهاتف أو الرقم..."
              className="w-full bg-brand-charcoal border border-gray-700 rounded-xl py-2 pr-10 pl-4 text-sm focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="bg-brand-charcoal border border-gray-700 rounded-xl py-2 px-4 text-sm focus:ring-1 focus:ring-brand-gold focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="completed">مكتمل</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading && orders.length === 0 ? (
          <div className="p-20 text-center text-gray-500 animate-pulse">جاري جلب الطلبات...</div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className={`bg-brand-dark rounded-2xl border transition-all overflow-hidden ${expandedOrder === order.id ? 'border-brand-gold ring-1 ring-brand-gold/20' : 'border-gray-800 hover:border-gray-700'}`}
            >
              {/* Main Row */}
              <div
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer"
                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center font-mono font-bold text-brand-gold border border-gray-800">
                    #{order.id}
                  </div>
                  <div>
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <User size={14} className="text-gray-500" /> {order.customer_name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> {order.customer_phone}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} /> {format(new Date(order.created_at), 'HH:mm - yyyy/MM/dd')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-gray-500">إجمالي الطلب</p>
                    <p className="text-xl font-black text-brand-gold">₪{order.total_after_discount}</p>
                  </div>

                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </div>

                  {expandedOrder === order.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedOrder === order.id && (
                <div className="border-t border-gray-800 bg-gray-900/30 p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Items List */}
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                        <Receipt size={16} /> محتويات الطلب
                      </h4>
                      <div className="space-y-3">
                        {order.items && JSON.parse(typeof order.items === 'string' ? order.items : JSON.stringify(order.items)).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-brand-charcoal/50 rounded-xl border border-gray-800">
                            <div>
                              <p className="font-bold text-gray-200">{item.title}</p>
                              {item.note && <p className="text-xs text-yellow-500/70 mt-0.5">ملاحظة: {item.note}</p>}
                            </div>
                            <div className="text-right">
                              <span className="text-brand-gold font-bold">x{item.quantity}</span>
                              <p className="text-xs text-gray-500">₪{item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.notes && (
                        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-xs text-yellow-200/60 leading-relaxed">
                          <span className="font-bold text-yellow-500 block mb-1">ملاحظات العميل:</span>
                          {order.notes}
                        </div>
                      )}
                    </div>

                    {/* Order Meta & Actions */}
                    <div className="flex flex-col justify-between">
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                          معلومات التوصيل
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin size={18} className="text-brand-gold mt-1 shrink-0" />
                            <div className="text-sm text-gray-300 italic">
                              {order.delivery_type === 'delivery' ? order.customer_location : 'استلام من المطعم (Pickup)'}
                            </div>
                          </div>
                          {order.coupon_code && (
                            <div className="bg-green-500/10 p-3 rounded-xl border border-green-500/20 text-xs text-green-400">
                              تم استخدام الكوبون الخصم: <span className="font-mono font-bold mr-2 text-white">{order.coupon_code}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-8">
                        <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">تغيير حالة الطلب</h4>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={updatingId === order.id || order.status === 'pending'}
                            onClick={() => handleUpdateStatus(order.id, 'pending')}
                            className="flex-1 py-3 px-4 bg-yellow-600/10 text-yellow-500 border border-yellow-500/20 rounded-xl font-bold text-sm hover:bg-yellow-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                          >
                            <Clock size={16} /> قيد الانتظار
                          </button>
                          <button
                            disabled={updatingId === order.id || order.status === 'completed'}
                            onClick={() => handleUpdateStatus(order.id, 'completed')}
                            className="flex-1 py-3 px-4 bg-green-600/10 text-green-500 border border-green-600/20 rounded-xl font-bold text-sm hover:bg-green-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                          >
                            <CheckCircle size={16} /> تم التجهيز
                          </button>
                          <button
                            disabled={updatingId === order.id || order.status === 'cancelled'}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className="flex-1 py-3 px-4 bg-red-600/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-sm hover:bg-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                          >
                            <XCircle size={16} /> إلغاء الطلب
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-brand-dark p-12 rounded-2xl border border-gray-800 text-center text-gray-500">
            لَم يتم العثور على أي طلبات في هذا التصنيف.
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
