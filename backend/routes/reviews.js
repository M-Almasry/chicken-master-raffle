const express = require('express');
const router = express.Router();
const pool = require('../db/connection');
const { checkProfanity, sanitizeText } = require('../utils/profanityFilter');

/**
 * POST /api/reviews
 * إضافة تقييم جديد
 */
router.post('/', async (req, res) => {
  try {
    const { name, rating, comment, fingerprint } = req.body;
    const ipAddress = req.ip || req.connection?.remoteAddress;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: {
          ar: 'التقييم يجب أن يكون بين 1 و 5 نجوم',
          en: 'Rating must be between 1 and 5 stars'
        }
      });
    }

    // Check for duplicate review from same device
    if (fingerprint) {
      const existing = await pool.query(
        'SELECT id FROM site_reviews WHERE fingerprint = $1',
        [fingerprint]
      );

      if (existing.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: {
            ar: 'لقد قمت بالتقييم مسبقاً، شكراً لك! 🙏',
            en: 'You have already submitted a review. Thank you! 🙏'
          }
        });
      }
    }

    // Also check IP as secondary measure
    const ipCheck = await pool.query(
      'SELECT id FROM site_reviews WHERE ip_address = $1 AND created_at > NOW() - INTERVAL \'24 hours\'',
      [ipAddress]
    );

    if (ipCheck.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: {
          ar: 'يمكنك التقييم مرة واحدة فقط، شكراً لك! 🙏',
          en: 'You can only submit one review. Thank you! 🙏'
        }
      });
    }

    // Profanity check on comment
    let cleanComment = comment || '';
    let isClean = true;
    if (cleanComment) {
      const profanityResult = checkProfanity(cleanComment);
      if (!profanityResult.isClean) {
        isClean = false;
        cleanComment = sanitizeText(cleanComment);
      }
    }

    // Profanity check on name
    let cleanName = (name || 'زبون').trim();
    if (cleanName) {
      const nameCheck = checkProfanity(cleanName);
      if (!nameCheck.isClean) {
        cleanName = 'زبون';
        isClean = false;
      }
    }

    // Insert review
    const result = await pool.query(
      `INSERT INTO site_reviews (name, fingerprint, ip_address, rating, comment, is_clean, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, rating, comment, created_at`,
      [cleanName, fingerprint || null, ipAddress, rating, cleanComment, isClean, isClean]
    );

    const review = result.rows[0];

    res.status(201).json({
      success: true,
      message: {
        ar: 'شكراً لتقييمك! رأيك يهمنا كثيراً 🌟',
        en: 'Thank you for your review! Your feedback means a lot 🌟'
      },
      data: {
        id: review.id,
        name: review.name,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.created_at
      }
    });

  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ أثناء إرسال التقييم',
        en: 'Error submitting review'
      }
    });
  }
});

/**
 * GET /api/reviews
 * جلب التقييمات العامة
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const result = await pool.query(
      `SELECT id, name, rating, comment, created_at
       FROM site_reviews
       WHERE is_public = true AND is_clean = true
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );

    // Calculate average rating
    const avgResult = await pool.query(
      `SELECT COUNT(*) as total, ROUND(AVG(rating)::numeric, 1) as average
       FROM site_reviews
       WHERE is_public = true AND is_clean = true`
    );

    const stats = avgResult.rows[0];

    res.json({
      success: true,
      data: result.rows,
      stats: {
        total: parseInt(stats.total),
        average: parseFloat(stats.average) || 0
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: {
        ar: 'حدث خطأ في جلب التقييمات',
        en: 'Error fetching reviews'
      }
    });
  }
});

/**
 * GET /api/reviews/stats
 * إحصائيات التقييمات
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total,
        ROUND(AVG(rating)::numeric, 1) as average,
        COUNT(*) FILTER (WHERE rating = 5) as five_star,
        COUNT(*) FILTER (WHERE rating = 4) as four_star,
        COUNT(*) FILTER (WHERE rating = 3) as three_star,
        COUNT(*) FILTER (WHERE rating = 2) as two_star,
        COUNT(*) FILTER (WHERE rating = 1) as one_star
      FROM site_reviews
      WHERE is_public = true AND is_clean = true
    `);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
