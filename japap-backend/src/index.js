const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Importer le service Telegram
const telegramBotService = require('./services/telegramBotService');

// Importer les routes
const alertRoutes = require('./routes/alerts');
const uploadRoutes = require('./routes/uploadImg');
const userRoutes = require('./routes/users');
const socialLinksRoutes = require('./routes/socialLinks');
const webhookRoutes = require('./routes/webhooks');
const broadcastChannelsRoutes = require('./routes/broadcastChannels');
const broadcastRoutes = require('./routes/broadcast');
const authRoutes = require('./routes/authRoutes');
const interestsRoutes = require('./routes/interests');

// Middlewares
app.use(cors()); // Activer CORS pour toutes les routes
app.use(express.json());

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social-links', socialLinksRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/broadcast-channels', broadcastChannelsRoutes);
app.use('/api/broadcast', broadcastRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/interests', interestsRoutes);


app.get('/', (req, res) => {
  res.send('Japap Backend is running!');
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Japap Backend listening on http://localhost:${port}`);
  console.log(`📱 Mobile app can connect via: http://192.168.1.64:${port}`);

  // Initialiser le bot Telegram
  telegramBotService.initialize();
});
