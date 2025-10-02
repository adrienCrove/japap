const express = require('express');
const { writeFile, mkdir } = require('fs/promises');
const { join } = require('path');
const multer = require('multer');
const router = express.Router();

// Configuration multer pour gérer les uploads
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier' });
    }

    // Générer un nom unique
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.originalname}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads');

    // Créer le dossier si nécessaire
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Le dossier existe déjà
    }

    const filepath = join(uploadDir, filename);
    await writeFile(filepath, file.buffer);

    // Note: Uncomment when Prisma is properly configured
    // const image = await prisma.image.create({
    //   data: {
    //     filename: filename,
    //     path: `/uploads/${filename}`,
    //   },
    // });

    res.json({
      success: true,
      // image: image,
      url: `/uploads/${filename}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;