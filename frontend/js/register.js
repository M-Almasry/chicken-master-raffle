// Registration Page JavaScript

let deviceFingerprint = null;

// Get device fingerprint on page load
document.addEventListener('DOMContentLoaded', () => {
  deviceFingerprint = getBrowserFingerprint();
  langManager.updateContent();
});

// Handle form submission
let socialClicks = { instagram: false, facebook: false };

function checkSocialRequirements() {
  if (socialClicks.instagram && socialClicks.facebook) {
    const btn = document.getElementById('submitBtn');
    const hint = document.getElementById('socialHint');
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.style.cursor = 'pointer';
    if (hint) hint.style.display = 'none';
  }
}

document.getElementById('btnInstagram').addEventListener('click', function () {
  socialClicks.instagram = true;
  this.classList.add('checked');
  checkSocialRequirements();
});

document.getElementById('btnFacebook').addEventListener('click', function () {
  socialClicks.facebook = true;
  this.classList.add('checked');
  checkSocialRequirements();
});

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById('submitBtn');
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  // Disable button and show loading
  submitBtn.disabled = true;
  const originalText = submitBtn.querySelector('span').textContent;
  submitBtn.innerHTML = `
    <div class="spinner"></div>
    <span data-i18n="submitting">${langManager.translate('submitting')}</span>
  `;

  try {
    // Send registration request
    const result = await apiRequest('/registrations', {
      method: 'POST',
      body: JSON.stringify({
        name,
        phone: formatPhone(phone),
        deviceFingerprint
      })
    });

    if (result.ok && result.data.success) {
      // Save coupon info for success page
      localStorage.setItem('registration_success', JSON.stringify({
        name: result.data.data.name,
        phone: result.data.data.phone,
        couponCode: result.data.data.couponCode,
        expiresAt: result.data.data.expiresAt
      }));

      // Redirect to success page
      window.location.href = 'success.html';
    } else {
      // Handle error
      const errorMessage = result.data?.message?.[langManager.getCurrentLang()]
        || langManager.translate('registrationError');
      showAlert(errorMessage, 'error');

      // Re-enable button
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span data-i18n="submit">${originalText}</span>`;
    }
  } catch (error) {
    console.error('Registration error:', error);
    showAlert(langManager.translate('registrationError'), 'error');

    // Re-enable button
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<span data-i18n="submit">${originalText}</span>`;
  }
});

// Send WhatsApp message to business
function sendWhatsAppMessage(name, phone, couponCode) {
  const message = `مرحباً، أنا *${name}* وأرغب بالتسجيل في سحب 100 شيكل! 🎉\n\nرقم جوالي: *${phone}*\nكوبوني: *${couponCode}*\n\nأريد الحصول على كوبون الخصم للدخول في السحب`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp in new tab
  window.open(url, '_blank');
}

// Phone input formatting
document.getElementById('phone').addEventListener('input', (e) => {
  let value = e.target.value.replace(/[^\d+]/g, '');
  e.target.value = value;
});
