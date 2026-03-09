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
  const message = `مرحباً، أنا *${name}* وأرغب بالتسجيل في سحب الجوائز النقدية! 🎉\n\nرقم جوالي: *${phone}*\nكوبوني: *${couponCode}*\n\nأريد الحصول على كوبون الخصم للدخول في السحب`;

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp in new tab
  window.open(url, '_blank');
}

// Phone input formatting
document.getElementById('phone').addEventListener('input', (e) => {
  let value = e.target.value.replace(/[^\d+]/g, '');
  e.target.value = value;
});

// --- Coupon Check Modal Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const viewCouponBtn = document.getElementById('viewCouponBtn');
  const couponCheckModal = document.getElementById('couponCheckModal');
  const closeCouponModal = document.getElementById('closeCouponModal');
  const checkCouponSubmitBtn = document.getElementById('checkCouponSubmitBtn');
  const checkPhoneInput = document.getElementById('checkPhoneInput');
  const couponModalActionBtn = document.getElementById('couponModalActionBtn');

  // Views inside modal
  const inputView = document.getElementById('couponCheckInputView');
  const resultView = document.getElementById('couponResultView');
  const resultIconContainer = document.getElementById('resultIconContainer');
  const resultTitle = document.getElementById('resultTitle');
  const resultText = document.getElementById('resultText');
  const couponCodeDisplay = document.getElementById('couponCodeDisplay');
  const couponCodeText = document.getElementById('couponCodeText');

  function openCouponModal() {
    if (!couponCheckModal) return;
    couponCheckModal.classList.add('active');
    // Reset views
    inputView.style.display = 'block';
    resultView.style.display = 'none';
    couponCodeDisplay.style.display = 'none';
    checkPhoneInput.value = '';
    setTimeout(() => checkPhoneInput.focus(), 100);
  }

  function closeCouponModalFunc() {
    if (couponCheckModal) couponCheckModal.classList.remove('active');
  }

  if (viewCouponBtn) viewCouponBtn.addEventListener('click', openCouponModal);
  if (closeCouponModal) closeCouponModal.addEventListener('click', closeCouponModalFunc);

  // Notice: couponModalActionBtn.addEventListener('click', closeCouponModalFunc) was removed
  // because we now assign the onClick handler dynamically based on the coupon status!

  // Check URL parameters to auto-open the modal
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('openCoupon') === 'true') {
    openCouponModal();
  }

  // Close modal when clicking outside
  if (couponCheckModal) {
    couponCheckModal.addEventListener('click', (e) => {
      if (e.target === couponCheckModal) closeCouponModalFunc();
    });
  }

  if (checkCouponSubmitBtn) {
    checkCouponSubmitBtn.addEventListener('click', async () => {
      const phone = checkPhoneInput.value.trim();
      const currentLang = langManager ? langManager.getCurrentLang() : 'ar';

      if (!phone) {
        alert(currentLang === 'ar' ? 'يرجى إدخال رقم الجوال' : 'Please enter a phone number');
        return;
      }

      checkCouponSubmitBtn.disabled = true;
      checkCouponSubmitBtn.textContent = currentLang === 'ar' ? 'جاري الفحص...' : 'Checking...';

      try {
        const response = await fetch(`${API_BASE_URL}/registrations/phone/${encodeURIComponent(phone)}`);
        const data = await response.json();

        inputView.style.display = 'none';
        resultView.style.display = 'block';

        if (response.ok && data.success) {
          const coupon = data.data;

          if (coupon.status === 'used') {
            // Coupon used
            resultIconContainer.innerHTML = '<i data-lucide="info" style="width: 64px; height: 64px; color: #E74C3C; display: inline-block;"></i>';
            resultTitle.textContent = currentLang === 'ar' ? 'تم استهلاك الكوبون' : 'Coupon Used';
            resultTitle.style.color = '#E74C3C';
            resultText.textContent = currentLang === 'ar' ? 'عذراً، لقد تم استهلاك الكوبون الخاص بك مسبقاً في طلب سابق.' : 'Sorry, your coupon has already been used on a previous order.';
            couponCodeDisplay.style.display = 'none';
            couponModalActionBtn.textContent = currentLang === 'ar' ? 'إغلاق' : 'Close';
            couponModalActionBtn.style.background = 'transparent';
            couponModalActionBtn.style.color = '#E74C3C';
            couponModalActionBtn.style.borderColor = '#E74C3C';
            couponModalActionBtn.onclick = closeCouponModalFunc;

          } else {
            // Coupon active
            resultIconContainer.innerHTML = '<i data-lucide="check-circle" style="width: 64px; height: 64px; color: #2ECC71; display: inline-block;"></i>';
            resultTitle.textContent = currentLang === 'ar' ? 'كوبونك الفعّال' : 'Your Active Coupon';
            resultTitle.style.color = '#2ECC71';
            resultText.textContent = currentLang === 'ar' ? 'تفضل كود الخصم الخاص بك، يمكنك استخدامه الآن عند إتمام الطلب للحصول على خصم 10% ودخول سحب الجوائز النقدية.' : 'Here is your active coupon. Use it during checkout to get 10% off and enter the cash prizes raffle.';

            couponCodeDisplay.style.display = 'block';
            couponCodeText.textContent = coupon.couponCode;

            // Redirect Button to Store
            couponModalActionBtn.textContent = currentLang === 'ar' ? 'الشراء لدخول السحب' : 'Order Now to enter draw';
            couponModalActionBtn.style.background = 'var(--color-gold)';
            couponModalActionBtn.style.color = '#1A1A1A';
            couponModalActionBtn.style.borderColor = 'var(--color-gold)';
            couponModalActionBtn.onclick = () => {
              window.location.href = `store.html?coupon=${coupon.couponCode}`;
            };
          }

        } else {
          // Not found or error
          resultIconContainer.innerHTML = '<i data-lucide="alert-circle" style="width: 64px; height: 64px; color: #F39C12; display: inline-block;"></i>';
          resultTitle.textContent = currentLang === 'ar' ? 'رقم غير مسجل' : 'Number Not Registered';
          resultTitle.style.color = '#F39C12';
          resultText.textContent = data.message[currentLang] || (currentLang === 'ar' ? 'لم نتمكن من العثور على كوبون مرتبط بهذا الرقم. تأكد من التسجيل في السحب أولاً.' : 'We could not find a coupon linked to this number. Make sure to register first.');
          couponCodeDisplay.style.display = 'none';
          couponModalActionBtn.textContent = currentLang === 'ar' ? 'إغلاق' : 'Close';
          couponModalActionBtn.style.background = 'transparent';
          couponModalActionBtn.style.color = '#F39C12';
          couponModalActionBtn.style.borderColor = '#F39C12';
          couponModalActionBtn.onclick = closeCouponModalFunc;
        }

        if (window.lucide) lucide.createIcons();

      } catch (error) {
        console.error('Error checking coupon:', error);
        alert(currentLang === 'ar' ? 'حدث خطأ في الشبكة، يرجى المحاولة لاحقاً' : 'Network error, please try again later');
        inputView.style.display = 'block';
        resultView.style.display = 'none';
      } finally {
        checkCouponSubmitBtn.disabled = false;
        checkCouponSubmitBtn.textContent = currentLang === 'ar' ? 'فحص الآن' : 'Check Now';
      }
    });
  }
});
