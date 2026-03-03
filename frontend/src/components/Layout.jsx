import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, LogOut, Activity } from 'lucide-react';


const Layout = () => {
  const navigate = useNavigate();
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const role = adminUser?.role || 'receiver';

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  // Define all nav items with the minimum role required
  const allNavItems = [
    { to: "/", icon: <LayoutDashboard size={20} />, label: "لوحة القيادة", roles: ['admin', 'superadmin'] },
    { to: "/orders", icon: <ShoppingBag size={20} />, label: "الطلبات", roles: ['admin', 'superadmin', 'receiver'] },
    { to: "/menu", icon: <UtensilsCrossed size={20} />, label: "قائمة الطعام", roles: ['admin', 'superadmin'] },
    { to: "/raffle", icon: <Activity size={20} />, label: "السحب", roles: ['admin', 'superadmin'] },
    { to: "/users", icon: <Users size={20} />, label: "المدراء", roles: ['superadmin'] },
  ];

  const navItems = allNavItems.filter(item => item.roles.includes(role));

  const getRoleLabel = (r) => {
    if (r === 'superadmin') return 'مدير النظام';
    if (r === 'manager') return 'مدير العمليات';
    if (r === 'receiver') return 'مستقبل الطلبات';
    return 'مدير';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-brand-charcoal text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark border-l border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800 flex items-center justify-center">
          <img
            src='/images/logo.png'
            alt="Chicken Master"
            className="w-64 h-16 rounded-2xl object-contain"
          />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                  ? 'bg-brand-gold/10 text-brand-gold font-bold shadow-[inset_4px_0_0_0_#D4A017]'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800 space-y-3">
          <div className="px-3 py-2 bg-gray-900/60 rounded-xl">
            <p className="text-xs font-bold text-gray-300 truncate">{adminUser?.username || 'مدير'}</p>
            <p className="text-[10px] text-brand-gold/70">{getRoleLabel(role)}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/30"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-brand-dark border-b border-gray-800 flex items-center justify-between px-6">
          <h2 className="text-lg font-semibold text-gray-200">
            أهلاً بك، {adminUser?.username || 'مدير النظام'}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 hidden sm:block">{getRoleLabel(role)}</span>
            <div className="h-8 w-8 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold font-bold text-sm">
              {adminUser?.username?.[0]?.toUpperCase() || 'A'}
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
