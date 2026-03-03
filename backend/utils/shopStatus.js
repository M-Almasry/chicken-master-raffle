/**
 * Calculates if the shop is currently open based on configuration and current time.
 * 
 * @param {Object} shopStatus - { is_open: boolean, mode: 'open'|'closed'|'auto', message: string }
 * @param {Object} openingHours - { [day]: { open: 'HH:mm', close: 'HH:mm', closed: boolean } }
 * @returns {Object} { is_open: boolean, message: string }
 */
function calculateShopStatus(shopStatus = {}, openingHours = {}) {
  const { mode = 'auto', is_open: manualIsOpen = true, message = '' } = shopStatus;

  // Manual overrides
  if (mode === 'open') return { is_open: true, message: message || 'أهلاً بكم، المحل مفتوح الآن' };
  if (mode === 'closed') return { is_open: false, message: message || 'نعتذر، المحل مغلق حالياً' };

  // Automatic calculation
  if (mode === 'auto') {
    const now = new Date();
    // Get day name in English lowercase (e.g., 'monday')
    const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayConfig = openingHours[dayName];

    if (!todayConfig || todayConfig.closed) {
      return { is_open: false, message: message || 'المحل مغلق لهذا اليوم' };
    }

    const { open, close } = todayConfig;
    if (!open || !close) {
      return { is_open: false, message: message || 'لم يتم ضبط ساعات العمل' };
    }

    // Convert "HH:mm" to comparable numbers
    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);

    const currentH = now.getHours();
    const currentM = now.getMinutes();

    const currentTime = currentH * 60 + currentM;
    const openTime = openH * 60 + openM;
    let closeTime = closeH * 60 + closeM;

    // Handle Closing after midnight (e.g. 11:00 AM to 02:00 AM)
    if (closeTime <= openTime) {
      // If current time is after opening but before end of day, OR before closing in the early morning
      if (currentTime >= openTime || currentTime < closeTime) {
        return { is_open: true, message: message || 'Welcome!' };
      }
    } else {
      // Normal range within the same day
      if (currentTime >= openTime && currentTime < closeTime) {
        return { is_open: true, message: message || 'Welcome!' };
      }
    }

    return { is_open: false, message: message || 'نحن خارج ساعات العمل الرسمية حالياً' };
  }

  // Fallback to manual flag if mode is unknown
  return { is_open: manualIsOpen, message };
}

module.exports = { calculateShopStatus };
