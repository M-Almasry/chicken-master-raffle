const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { generateCouponCode } = require('../utils/couponGenerator');
const { checkDuplicateRegistration, validatePhoneNumber } = require('../middleware/security');

/**
 * POST /api/registrations
 * تسجيل مستخدم جديد
 */
router.post('/', validatePhoneNumber, checkDuplicateRegistration, async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, phone, deviceFingerprint } = req.body;
    const ipAddress = req.clientIp;

    // التحقق من اسم المستخدم
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: {
          ar: 'الاسم يجب أن يكون حرفين على الأقل',
          en: 'Name must be at least 2 characters'
        }
      });
    }

    await client.query('BEGIN');

    // فحص إذا كان الرقم مسجل من قبل
    // فحص إذا كان الرقم مسجل من قبل
    const phoneCheck = await client.query(
      'SELECT id, coupon_code, coupon_status FROM registrations WHERE phone = $1',
      [phone]
    );

    if (phoneCheck.rows.length > 0) {
      const existing = phoneCheck.rows[0];
      await client.query('ROLLBACK');

      let arMsg = 'تم استخدام هذا الرقم مسبقا';
      let enMsg = 'This number has already been used';

      // إذا كان الكوبون غير مستخدم، نعرض الكود للزبون
      if (existing.coupon_status === 'new') {
        arMsg = `تم استخدام هذا الرقم مسبقا و رقم باركودك هو ${existing.coupon_code}`;
        enMsg = `This number is already registered. Your coupon code is ${existing.coupon_code}`;
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

    // توليد كوبون فريد
    let couponCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      couponCode = generateCouponCode();
      const couponCheck = await client.query(
        'SELECT id FROM registrations WHERE coupon_code = $1',
        [couponCode]
      );
      isUnique = couponCheck.rows.length === 0;
      attempts++;
    }

    if (!isUnique) {
      throw new Error('Failed to generate unique coupon');
    }

    // إدراج التسجيل الجديد
    const result = await client.query(
      `INSERT INTO registrations (name, phone, coupon_code, ip_address, device_fingerprint)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, phone, coupon_code, created_at, expires_at`,
      [name.trim(), phone, couponCode, ipAddress, deviceFingerprint || null]
    );

    await client.query('COMMIT');

    const registration = result.rows[0];

    res.status(201).json({
      success: true,
      message: {
        ar: 'تم التسجيل بنجاح!',
        en: 'Registration successful!'
      },
      data: {
        id: registration.id,
        name: registration.name,
        phone: registration.phone,
        couponCode: registration.coupon_code,
        createdAt: registration.created_at,
        expiresAt: registration.expires_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in registration:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ أثناء التسجيل',
        en: 'Error during registration'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/registrations/coupon/:couponCode
 * الحصول على معلومات كوبون
 */
router.get('/coupon/:couponCode', async (req, res) => {
  try {
    const { couponCode } = req.params;

    const result = await pool.query(
      `SELECT id, name, phone, coupon_code, coupon_status, created_at, expires_at
       FROM registrations
       WHERE coupon_code = $1`,
      [couponCode.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: {
          ar: 'الكوبون غير موجود',
          en: 'Coupon not found'
        }
      });
    }

    const coupon = result.rows[0];

    res.json({
      success: true,
      data: {
        id: coupon.id,
        name: coupon.name,
        phone: coupon.phone,
        couponCode: coupon.coupon_code,
        status: coupon.coupon_status,
        createdAt: coupon.created_at,
        expiresAt: coupon.expires_at
      }
    });

  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ في جلب معلومات الكوبون',
        en: 'Error fetching coupon information'
      }
    });
  }
});

/**
 * GET /api/registrations/phone/:phone
 * استرجاع الكوبون برقم الجوال
 */
router.get('/phone/:phone', async (req, res) => {
  try {
    let { phone } = req.params;

    // توحيد صيغة الرقم
    phone = phone.replace(/[\s-]/g, '');
    if (phone.startsWith('0')) {
      phone = '+970' + phone.substring(1);
    } else if (phone.startsWith('970')) {
      phone = '+' + phone;
    } else if (!phone.startsWith('+')) {
      phone = '+970' + phone;
    }

    const result = await pool.query(
      `SELECT id, name, phone, coupon_code, coupon_status, created_at, expires_at
       FROM registrations
       WHERE phone = $1`,
      [phone]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: {
          ar: 'لم يتم العثور على تسجيل بهذا الرقم',
          en: 'No registration found with this phone number'
        }
      });
    }

    const registration = result.rows[0];

    res.json({
      success: true,
      data: {
        id: registration.id,
        name: registration.name,
        phone: registration.phone,
        couponCode: registration.coupon_code,
        status: registration.coupon_status,
        createdAt: registration.created_at,
        expiresAt: registration.expires_at
      }
    });

  } catch (error) {
    console.error('Error fetching registration by phone:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ في جلب معلومات التسجيل',
        en: 'Error fetching registration information'
      }
    });
  }
});

module.exports = router;
