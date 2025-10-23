# Firebase Vertex AI - Quick Reference

## Configuration Status

STATUS: VERIFIED AND OPERATIONAL
Date: October 18, 2025

---

## Quick Test

```bash
cd japap-backend
node test-firebase-config.js
```

Expected output: `✅ All critical configuration checks passed!`

---

## Environment Variables (.env)

```bash
GOOGLE_CLOUD_PROJECT_ID="japap-468115"
FIREBASE_PROJECT_ID="japap-468115"
GOOGLE_APPLICATION_CREDENTIALS="./config/japap-468115-2dbc2da938ef.json"
VERTEX_AI_LOCATION="us-central1"
IMAGE_ENHANCEMENT_ENABLED=true
IMAGE_ENHANCEMENT_CATEGORIES="DISP,DECD"
```

---

## Service Account

- **File**: `config/japap-468115-2dbc2da938ef.json`
- **Project**: japap-468115
- **Email**: japap-vertex-ai-service@japap-468115.iam.gserviceaccount.com
- **Protected**: YES (in .gitignore)

---

## How It Works

1. Upload image for DISP or DECD alert
2. System automatically enhances in background (2-5 seconds)
3. Both original and enhanced versions saved
4. Enhanced version used in alert display

---

## Files

### Configuration
- `src/config/vertexai.js` - Vertex AI setup
- `.env` - Environment variables
- `config/japap-468115-2dbc2da938ef.json` - Service account

### Services
- `src/services/imageEnhancementService.js` - Enhancement logic
- `src/middleware/categoryImageEnhancement.js` - Auto-trigger middleware

### Documentation
- `IMAGE_ENHANCEMENT_README.md` - Complete guide
- `FIREBASE_VERTEX_AI_VERIFICATION_REPORT.md` - Technical details
- `FIREBASE_SETUP_VERIFIED.md` - Summary
- `QUICK_REFERENCE_FIREBASE.md` - This file

---

## Commands

### Test Configuration
```bash
node test-firebase-config.js
```

### Start Backend
```bash
npm run dev
```

### Check Logs
```bash
# Look for:
✅ Firebase Admin initialized with service account
🎨 Triggering automatic image enhancement
✅ Image enhancement completed
```

---

## Cost

- **Free**: 500 images/day
- **Paid**: $0.039/image after free tier
- **Current**: Only DISP + DECD categories

---

## Troubleshooting

### Error: "Module not found"
```bash
npm install
```

### Error: "Firebase Admin initialization failed"
```bash
# Check .env file exists and has correct values
cat .env | grep GOOGLE
```

### Error: "Permission denied"
Check service account permissions at:
https://console.cloud.google.com/iam-admin/iam?project=japap-468115

---

## Important URLs

- Firebase Console: https://console.firebase.google.com/project/japap-468115
- Google Cloud: https://console.cloud.google.com/vertex-ai?project=japap-468115
- Service Accounts: https://console.cloud.google.com/iam-admin/iam?project=japap-468115

---

## Security Checklist

- [ ] Service account file in .gitignore
- [ ] .env file in .gitignore
- [ ] Service account has minimal permissions (Vertex AI User only)
- [ ] No credentials in git history

---

## Enhanced Image Details

### Location Pattern
```
Original:  /uploads/alerts/{alertId}/{filename}.jpg
Enhanced:  /uploads/alerts/{alertId}/{filename}_enhanced.jpg
```

### Database Fields
- `isEnhanced`: true/false
- `originalImageId`: ID of original image
- `enhancementMetadata`: JSON with model, cost, time, etc.

---

## Support

1. Run test: `node test-firebase-config.js`
2. Check logs when starting server
3. Review documentation in `IMAGE_ENHANCEMENT_README.md`

---

Last Verified: October 18, 2025
Status: OPERATIONAL
