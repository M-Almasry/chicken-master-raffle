const { customAlphabet } = require('nanoid');

// إنشاء مولد كوبونات مخصص
// يستخدم أحرف وأرقام فقط (بدون أحرف مشابهة مثل 0/O, 1/I/l)
const nanoid = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

/**
 * توليد كود كوبون فريد
 * @returns {string} كوبون بصيغة CHICK-XXXXXX
 */
function generateCouponCode() {
  const code = nanoid();
  return `CHICK-${code}`;
}

/**
 * التحقق من صحة صيغة الكوبون
 * @param {string} coupon - كود الكوبون
 * @returns {boolean}
 */
function isValidCouponFormat(coupon) {
  return /^CHICK-[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(coupon);
}

module.exports = {
  generateCouponCode,
  isValidCouponFormat
};
