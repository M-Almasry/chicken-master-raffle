(function () {
  // 1. Determine API URL
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE_URL = isLocal ? 'http://localhost:3000/api' : 'https://chicken-master-raffle.onrender.com/api';

  console.log('Admin Config Loaded. API URL:', API_BASE_URL);

  // 2. Auth Check
  const token = localStorage.getItem('admin_token');
  const permissions = JSON.parse(localStorage.getItem('admin_permissions') || '[]');

  if (!token && !window.location.pathname.includes('login.html')) {
    window.location.href = 'login.html';
  }

  // 3. Header HTML
  const headerHTML = `
    <header class="admin-header" style="background: linear-gradient(135deg, #000 0%, #1A1A1A 100%); border-bottom: 2px solid #d4a017; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); direction: rtl;">
      <div class="logo-area" style="display: flex; align-items: center; gap: 1rem;">
        <img src="../assets/assets/images/logo.png" alt="Logo" class="logo-img" style="height: 50px;">
        <h1 style="margin: 0; color: #d4a017; font-family: 'Playfair Display', serif; font-size: 1.5rem;">لوحة التحكم</h1>
      </div>

      <nav class="nav-links" style="display: flex; gap: 1.5rem; flex-wrap: wrap; justify-content: center;">
        <a href="dashboard.html" class="nav-link">الرئيسية</a>
        <a href="orders.html" class="nav-link">الطلبات</a>
        <a href="menu.html" class="nav-link">إدارة المنيو</a>
        <a href="users.html" class="nav-link" id="nav-users" style="display: none;">المستخدمين</a>
      </nav>

      <button id="logoutBtn" class="logout-btn" style="background: transparent; border: 1px solid #E74C3C; color: #E74C3C; padding: 0.5rem 1.5rem; border-radius: 4px; cursor: pointer; font-family: 'Cairo', sans-serif; transition: all 0.3s ease;">تسجيل الخروج</button>
    </header>
    <style>
      .nav-link { color: #ccc; text-decoration: none; font-weight: 600; padding: 0.5rem; transition: color 0.3s; font-family: 'Cairo', sans-serif; }
      .nav-link:hover, .nav-link.active { color: #d4a017 !important; }
      .logout-btn:hover { background: #E74C3C !important; color: white !important; }
      @media (max-width: 768px) {
        .admin-header { flex-direction: column; gap: 1rem; text-align: center; }
        .logo-area { margin-bottom: 0.5rem; }
        .nav-links { width: 100%; justify-content: center; }
      }
    </style>
    `;

  // 4. Inject Header
  const container = document.getElementById('admin-header-container');
  if (container) {
    container.innerHTML = headerHTML;
  } else {
    // Fallback: Try to find existing header to replace or prepend to body
    const existingHeader = document.querySelector('header');
    if (existingHeader) {
      existingHeader.outerHTML = headerHTML;
    } else {
      document.body.insertAdjacentHTML('afterbegin', headerHTML);
    }
  }

  // 5. Highlight Active Link
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.nav-link');
  links.forEach(link => {
    if (currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });

  // 6. Permission Check for Users Link
  if (permissions.includes('users')) {
    const usersLink = document.getElementById('nav-users');
    if (usersLink) usersLink.style.display = 'block';
  }

  // 7. Logout Logic
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_permissions');
      window.location.href = 'login.html';
    });
  }

  // 8. Global Authorized Request Helper
  window.authorizedRequest = async function (endpoint, options = {}) {
    const token = localStorage.getItem('admin_token'); // Get fresh token
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (error) {
      console.error('API Request Error:', error);
      return { ok: false, error: error.message };
    }
  };
})();
