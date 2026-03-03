import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Search, Filter, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, MapPin, Phone, User, Receipt, Volume2, VolumeX } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, error
  const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
    return localStorage.getItem('admin_orders_sound') === 'true';
  });
  const lastSoundTime = useRef(0);

  const playNotificationSound = (type = 'new') => {
    if (!isSoundEnabled) return;
    const now = Date.now();
    if (now - lastSoundTime.current < 3000) return; // 3s throttle
    lastSoundTime.current = now;

    const urls = {
      new: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
      cancel: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3' // Thicker/Deeper sound
    };

    const audio = new Audio(urls[type] || urls.new);
    if (type === 'cancel') audio.volume = 0.8;
    audio.play().catch(e => console.error('Audio play failed:', e));
  };

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get(`/admin/orders?status=${filter}&limit=50`);
      setOrders(res.data.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // SSE Real-time Updates
    const token = localStorage.getItem('adminToken');
    const baseUrl = api.defaults.baseURL;
    const sseUrl = `${baseUrl}/admin/orders/stream?token=${token}`;

    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setConnectionStatus('connected');
    };

    eventSource.onerror = () => {
      setConnectionStatus('error');
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Real-time update:', data);

        if (data.type === 'new_order') {
          playNotificationSound('new');
          fetchOrders(true); // Silent refresh
        } else if (data.type === 'customer_cancelled') {
          playNotificationSound('cancel');
          fetchOrders(true); // Silent refresh
        } else if (data.type === 'order_status_update') {
          // Update the specific order in the list without full fetch if possible
          setOrders(prev => prev.map(o => o.id.toString() === data.orderId.toString() ? { ...o, status: data.status } : o));
        }
      } catch (e) {
        console.error('Error parsing SSE data:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [filter]);

  const toggleSound = () => {
    const newState = !isSoundEnabled;
    setIsSoundEnabled(newState);
    localStorage.setItem('admin_orders_sound', newState.toString());

    // Play a short sound once to confirm/unlock audio if enabling
    if (newState) {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => { });
    }
  };

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
      case 'preparing': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'shipped': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'delivered':
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'preparing': return 'تجهيز';
      case 'shipped': return 'مع السائق';
      case 'delivered':
      case 'completed': return 'مكتمل';
      case 'cancelled': return 'ملغي';
      default: return status;
    }
  };

  const isCancelledByCustomer = (order) => {
    return order.status === 'cancelled' && (order.notes || '').includes('عن طريق الزبون');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-brand-dark p-6 rounded-2xl border border-gray-800 shadow-xl">
        <div>
          <h1 className="text-2xl font-bold font-playfair text-brand-gold flex items-center gap-2">
            <ShoppingBag size={28} /> إدارة الطلبات
            <div
              className={`w-3 h-3 rounded-full ml-2 ${connectionStatus === 'connected' ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}
              title={connectionStatus === 'connected' ? 'متصل (وقت حقيقي)' : connectionStatus === 'connecting' ? 'جاري الاتصال...' : 'فشل الاتصال - يرجى التنشيط'}
            />
          </h1>
          <p className="text-gray-400 mt-1">مراقبة الطلبات المباشرة وتحديث حالاتها (SSE)</p>
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

          <button
            onClick={toggleSound}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl border transition-all font-bold text-sm ${isSoundEnabled ? 'bg-brand-gold/20 text-brand-gold border-brand-gold/30 hover:bg-brand-gold/30' : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'}`}
            title={isSoundEnabled ? "إيقاف الصوت" : "تشغيل الصوت عند وصول طلب جديد"}
          >
            {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            <span className="hidden sm:inline">{isSoundEnabled ? 'التنبيه مفعل' : 'تفعيل التنبيه'}</span>
          </button>
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
                    <p className="text-xs text-gray-500">للمحل (صفي)</p>
                    <p className="text-xl font-black text-brand-gold">₪{parseFloat(order.total_after_discount - (order.delivery_fee || 0)).toFixed(2)}</p>
                    {order.delivery_fee > 0 && <p className="text-[10px] text-gray-400 mt-1">+ ₪{order.delivery_fee} توصيل</p>}
                  </div>

                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusStyle(order.status)} ${isCancelledByCustomer(order) ? 'bg-red-600 text-white border-red-600 animate-pulse' : ''}`}>
                    {isCancelledByCustomer(order) ? 'ملغي من الزبون 🔴' : getStatusLabel(order.status)}
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

                      <div className="mt-4 pt-4 border-t border-gray-800 space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>مجموع الأصناف:</span>
                          <span>₪{parseFloat(order.total_after_discount - (order.delivery_fee || 0)).toFixed(2)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>رسوم التوصيل (للسائق):</span>
                            <span>₪{order.delivery_fee}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold text-brand-gold pt-1">
                          <span>إجمالي العميل:</span>
                          <span>₪{order.total_after_discount}</span>
                        </div>
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
                        <h4 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">تغيير حالة الطلب (تتبع مباشر)</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className={`py-3 px-4 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${order.status === 'preparing' ? 'bg-blue-600 text-white border-blue-600' : 'bg-blue-600/10 text-blue-500 border-blue-500/20 hover:bg-blue-600/20'}`}
                          >
                            <span className="shrink-0 text-lg">🔥</span> تجهيز
                          </button>

                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'shipped')}
                            className={`py-3 px-4 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${order.status === 'shipped' ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-600/10 text-purple-500 border-purple-500/20 hover:bg-purple-600/20'}`}
                          >
                            <span className="shrink-0 text-lg">🚚</span> شحن
                          </button>

                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'delivered')}
                            className={`py-3 px-4 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${['delivered', 'completed'].includes(order.status) ? 'bg-green-600 text-white border-green-600' : 'bg-green-600/10 text-green-500 border-green-500/20 hover:bg-green-600/20'}`}
                          >
                            <span className="shrink-0 text-lg">✅</span> تسليم
                          </button>

                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                            className={`py-3 px-4 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${order.status === 'cancelled' ? 'bg-red-600 text-white border-red-600' : 'bg-red-600/10 text-red-500 border-red-500/20 hover:bg-red-600/20'}`}
                          >
                            إلغاء
                          </button>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            disabled={updatingId === order.id}
                            onClick={() => handleUpdateStatus(order.id, 'pending')}
                            className="flex-1 py-2 bg-gray-800 text-gray-400 border border-gray-700 rounded-xl text-xs hover:bg-gray-700 transition-all"
                          >
                            رجوع للانتظار
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
