const pool = require('../db/connection');

/**
 * Middleware للتحقق من IP و Device Fingerprint
 * يمنع التسجيل المتكرر من نفس الجهاز أو IP
 */
async function checkDuplicateRegistration(req, res, next) {
  try {
    const { deviceFingerprint } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // فحص IP
    const ipCheck = await pool.query(
      'SELECT id, coupon_code, coupon_status FROM registrations WHERE ip_address = $1',
      [ipAddress]
    );

    if (ipCheck.rows.length > 0) {
      const existing = ipCheck.rows[0];
      let arMsg = 'لقد سجلت من قبل من هذا الجهاز';
      let enMsg = 'You have already registered from this device';

      if (existing.coupon_status === 'new') {
        arMsg += ` ورقم باركودك هو ${existing.coupon_code}`;
        enMsg += `. Your coupons code is ${existing.coupon_code}`;
      }

      return res.status(409).json({
        success: false,
        message: {
          ar: arMsg,
          en: enMsg
        },
        existingCoupon: existing.coupon_code
      });
    }

    // فحص Device Fingerprint إذا كان موجوداً
    if (deviceFingerprint) {
      const deviceCheck = await pool.query(
        'SELECT id, coupon_code, coupon_status FROM registrations WHERE device_fingerprint = $1',
        [deviceFingerprint]
      );

      if (deviceCheck.rows.length > 0) {
        const existing = deviceCheck.rows[0];
        let arMsg = 'لقد سجلت من قبل من هذا الجهاز';
        let enMsg = 'You have already registered from this device';

        if (existing.coupon_status === 'new') {
          arMsg += ` ورقم باركودك هو ${existing.coupon_code}`;
          enMsg += `. Your coupons code is ${existing.coupon_code}`;
        }

        return res.status(409).json({
          success: false,
          message: {
            ar: arMsg,
            en: enMsg
          },
          existingCoupon: existing.coupon_code
        });
      }
    }

    // حفظ IP في الطلب للاستخدام لاحقاً
    req.clientIp = ipAddress;
    next();
  } catch (error) {
    console.error('Error in checkDuplicateRegistration:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ في التحقق من البيانات',
        en: 'Error verifying registration data'
      }
    });
  }
}

/**
 * Middleware للتحقق من رقم الجوال
 */
function validatePhoneNumber(req, res, next) {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({
      success: false,
      message: {
        ar: 'رقم الجوال مطلوب',
        en: 'Phone number is required'
      }
    });
  }

  // التحقق من صيغة رقم الجوال الفلسطيني
  const phoneRegex = /^(\+970|970|0)?5[0-9]{8}$/;
  const cleanPhone = phone.replace(/[\s-]/g, '');

  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({
      success: false,
      message: {
        ar: 'رقم الجوال غير صحيح',
        en: 'Invalid phone number'
      }
    });
  }

  // توحيد صيغة رقم الجوال
  let normalizedPhone = cleanPhone;
  if (normalizedPhone.startsWith('0')) {
    normalizedPhone = '+970' + normalizedPhone.substring(1);
  } else if (normalizedPhone.startsWith('970')) {
    normalizedPhone = '+' + normalizedPhone;
  } else if (!normalizedPhone.startsWith('+')) {
    normalizedPhone = '+970' + normalizedPhone;
  }

  req.body.phone = normalizedPhone;
  next();
}

module.exports = {
  checkDuplicateRegistration,
  validatePhoneNumber
};
