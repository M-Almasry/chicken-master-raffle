const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { isValidCouponFormat } = require('../utils/couponGenerator');

/**
 * POST /api/orders
 * إنشاء طلب جديد
 */
router.post('/', async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      customerName,
      customerPhone,
      customerLocation,
      items,
      couponCode,
      totalBeforeDiscount,
      deliveryType,
      notes
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!customerName || !customerPhone || !items || items.length === 0 || !deliveryType) {
      return res.status(400).json({
        success: false,
        message: {
          ar: 'بيانات الطلب غير مكتملة',
          en: 'Order data incomplete'
        }
      });
    }

    if (deliveryType === 'delivery' && !customerLocation) {
      return res.status(400).json({
        success: false,
        message: {
          ar: 'الموقع مطلوب للتوصيل',
          en: 'Location required for delivery'
        }
      });
    }

    await client.query('BEGIN');

    let discountAmount = 0;
    let registrationId = null;

    // التحقق من الكوبون إذا تم إدخاله
    if (couponCode) {
      if (!isValidCouponFormat(couponCode)) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: {
            ar: 'صيغة الكوبون غير صحيحة',
            en: 'Invalid coupon format'
          }
        });
      }

      const couponResult = await client.query(
        `SELECT id, coupon_status, expires_at FROM registrations WHERE coupon_code = $1`,
        [couponCode.toUpperCase()]
      );

      if (couponResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: {
            ar: 'الكوبون غير موجود',
            en: 'Coupon not found'
          }
        });
      }

      const coupon = couponResult.rows[0];

      // فحص حالة الكوبون
      if (coupon.coupon_status === 'used') {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: {
            ar: 'الكوبون مستخدم من قبل',
            en: 'Coupon already used'
          }
        });
      }

      if (coupon.coupon_status === 'expired' || new Date(coupon.expires_at) < new Date()) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: {
            ar: 'الكوبون منتهي الصلاحية',
            en: 'Coupon expired'
          }
        });
      }

      // حساب الخصم 10%
      discountAmount = (totalBeforeDiscount * 0.1).toFixed(2);
      registrationId = coupon.id;

      // تحديث حالة الكوبون إلى مستخدم
      await client.query(
        `UPDATE registrations SET coupon_status = 'used' WHERE coupon_code = $1`,
        [couponCode.toUpperCase()]
      );
    }

    const totalAfterDiscount = (totalBeforeDiscount - discountAmount).toFixed(2);

    // إدراج الطلب
    const orderResult = await client.query(
      `INSERT INTO orders 
       (customer_name, customer_phone, customer_location, items, coupon_code, 
        discount_amount, total_before_discount, total_after_discount, delivery_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, created_at`,
      [
        customerName,
        customerPhone,
        customerLocation || null,
        JSON.stringify(items),
        couponCode ? couponCode.toUpperCase() : null,
        discountAmount,
        totalBeforeDiscount,
        totalAfterDiscount,
        deliveryType,
        notes || null
      ]
    );

    const orderId = orderResult.rows[0].id;

    // إذا استخدم كوبون، إضافته لجدول السحب
    if (registrationId) {
      await client.query(
        `INSERT INTO raffle_entries (registration_id, order_id)
         VALUES ($1, $2)`,
        [registrationId, orderId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: {
        ar: 'تم إنشاء الطلب بنجاح!',
        en: 'Order created successfully!'
      },
      data: {
        orderId: orderId,
        totalBeforeDiscount: parseFloat(totalBeforeDiscount),
        discountAmount: parseFloat(discountAmount),
        totalAfterDiscount: parseFloat(totalAfterDiscount),
        enteredRaffle: registrationId !== null,
        createdAt: orderResult.rows[0].created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ أثناء إنشاء الطلب',
        en: 'Error creating order'
      }
    });
  } finally {
    client.release();
  }
});

/**
 * GET /api/orders/:id
 * الحصول على تفاصيل طلب
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: {
          ar: 'الطلب غير موجود',
          en: 'Order not found'
        }
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ في جلب الطلب',
        en: 'Error fetching order'
      }
    });
  }
});

module.exports = router;
