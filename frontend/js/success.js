// Success Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Get registration data from localStorage
  const registrationData = localStorage.getItem('registration_success');

  if (!registrationData) {
    // No registration data, redirect to home
    window.location.href = 'index.html';
    return;
  }

  const data = JSON.parse(registrationData);

  // Display coupon code
  document.getElementById('couponCode').textContent = data.couponCode;

  // Display expiry date
  const expiryDate = new Date(data.expiresAt);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  const formattedDate = expiryDate.toLocaleDateString('ar-EG', options);
  document.getElementById('expiryDate').textContent = formattedDate;

  // Copy button
  document.getElementById('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(data.couponCode).then(() => {
      const btn = document.getElementById('copyBtn');
      const originalHTML = btn.innerHTML;

      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
      btn.style.background = '#27AE60';

      setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
      }, 2000);
    });
  });

  // Share button
  document.getElementById('shareBtn').addEventListener('click', () => {
    const message = `🎉 سجلت في سحب 100 شيكل من مستر تشيكن!\n\nواستلمت كوبون خصم 10%: ${data.couponCode}\n\nسجل أنت كمان من هنا: ${window.location.origin}/register.html`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  });

  // Clear registration data after 5 minutes (to prevent refresh issues)
  setTimeout(() => {
    localStorage.removeItem('registration_success');
  }, 5 * 60 * 1000);

  langManager.updateContent();
});
