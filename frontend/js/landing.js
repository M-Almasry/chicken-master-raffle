// Landing Page JavaScript

// Countdown Timer to End of Ramadan 2026
function initCountdown() {
  const endDate = new Date('2026-03-29T23:59:59').getTime();

  function updateTimer() {
    const now = new Date().getTime();
    const distance = endDate - now;

    if (distance < 0) {
      document.getElementById('days').textContent = '00';
      document.getElementById('hours').textContent = '00';
      document.getElementById('minutes').textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    document.getElementById('days').textContent = String(days).padStart(2, '0');
    document.getElementById('hours').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 60000); // Update every minute
}

// Update terms list based on language
function updateTermsList() {
  const termsList = document.getElementById('termsList');
  if (!termsList) return;

  const terms = translations[langManager.getCurrentLang()].terms;
  termsList.innerHTML = terms.map(term => `<li>${term}</li>`).join('');
}

// Intersection Observer for animations
function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, {
    threshold: 0.1
  });

  document.querySelectorAll('.step-card, .terms-list li').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initCountdown();
  updateTermsList();
  initAnimations();
  langManager.updateContent();

  // Update terms list when language changes
  const originalSetLanguage = langManager.setLanguage.bind(langManager);
  langManager.setLanguage = function (lang) {
    originalSetLanguage(lang);
    updateTermsList();
  };
});
