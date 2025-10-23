/**
 * Category Image Enhancement Middleware
 * Automatically triggers image enhancement for specific alert categories (DISP, DECD)
 */

const { shouldEnhanceImage, enhanceAlertImage, updateAlertWithEnhancedImage } = require('../services/imageEnhancementService');

/**
 * Middleware to trigger automatic image enhancement for specific categories
 * Runs asynchronously after image upload completes
 *
 * Usage: Add to routes where images are uploaded for alerts (e.g., adminUpload.js)
 *
 * @param {Object} imageRecord - Created image record from database
 * @param {string} categoryCode - Alert category code (e.g., "DISP", "DECD")
 * @param {string} alertId - Alert ID (optional, for updating alert with enhanced image)
 * @returns {Promise<void>}
 */
async function triggerCategoryImageEnhancement(imageRecord, categoryCode, alertId = null) {
  try {
    // Check if category requires enhancement
    if (!shouldEnhanceImage(categoryCode)) {
      console.log(`ℹ️ Category ${categoryCode} does not require automatic enhancement`);
      return;
    }

    console.log(`🎨 Triggering automatic image enhancement for category ${categoryCode}, image ID: ${imageRecord.id}`);

    // Enhancement runs in background (non-blocking)
    setImmediate(async () => {
      try {
        const result = await enhanceAlertImage(imageRecord.id, alertId);

        if (result.success) {
          console.log(`✅ Image enhanced successfully: ${result.enhancedImageId}`);
          console.log(`   - Processing time: ${result.processingTime}ms`);
          console.log(`   - Cost: $${result.cost}`);

          // If alert ID provided, update alert to use enhanced image
          if (alertId && result.enhancedImageUrl) {
            await updateAlertWithEnhancedImage(alertId, result.enhancedImageUrl);
          }
        } else {
          console.warn(`⚠️ Image enhancement failed: ${result.error}`);
        }
      } catch (error) {
        console.error(`❌ Background image enhancement error:`, error);
      }
    });

  } catch (error) {
    console.error('❌ Error in triggerCategoryImageEnhancement:', error);
    // Don't throw - enhancement failure shouldn't block main request
  }
}

/**
 * Express middleware wrapper for automatic enhancement
 * Use this after successful image upload in routes
 *
 * Example usage:
 * ```
 * router.post('/upload', upload.single('file'), async (req, res) => {
 *   // ... upload logic ...
 *   const imageRecord = await prisma.image.create({ ... });
 *
 *   // Trigger enhancement if needed
 *   req.imageRecord = imageRecord;
 *   req.categoryCode = req.body.category;
 *   req.alertId = req.body.entityId;
 *   next();
 * }, autoEnhanceMiddleware);
 * ```
 */
const autoEnhanceMiddleware = async (req, res, next) => {
  try {
    const { imageRecord, categoryCode, alertId } = req;

    if (imageRecord && categoryCode) {
      // Trigger enhancement asynchronously (non-blocking)
      triggerCategoryImageEnhancement(imageRecord, categoryCode, alertId);
    }

    next();
  } catch (error) {
    console.error('❌ Error in autoEnhanceMiddleware:', error);
    next(); // Continue even if enhancement setup fails
  }
};

/**
 * Batch enhancement for multiple images
 * Useful for re-processing existing images or bulk operations
 *
 * @param {Array<{imageId: string, categoryCode: string, alertId?: string}>} images - Array of image configs
 * @returns {Promise<Array<Object>>} - Array of enhancement results
 */
async function batchEnhanceImages(images) {
  console.log(`🎨 Starting batch enhancement for ${images.length} images`);

  const results = [];

  for (const { imageId, categoryCode, alertId } of images) {
    try {
      if (!shouldEnhanceImage(categoryCode)) {
        results.push({ imageId, success: false, error: 'Category does not require enhancement' });
        continue;
      }

      const result = await enhanceAlertImage(imageId, alertId);
      results.push({ imageId, ...result });

      // Update alert if successful
      if (result.success && alertId && result.enhancedImageUrl) {
        await updateAlertWithEnhancedImage(alertId, result.enhancedImageUrl);
      }

      // Rate limiting: wait 1 second between requests to avoid hitting API limits
      await new Promise((resolve) => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ Batch enhancement error for image ${imageId}:`, error);
      results.push({ imageId, success: false, error: error.message });
    }
  }

  console.log(`✅ Batch enhancement completed: ${results.filter(r => r.success).length}/${images.length} successful`);

  return results;
}

module.exports = {
  triggerCategoryImageEnhancement,
  autoEnhanceMiddleware,
  batchEnhanceImages,
};
