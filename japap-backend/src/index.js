const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4000;

// Importer les routes
const alertRoutes = require('./routes/alerts');
const uploadRoutes = require('./routes/uploadImg');
const userRoutes = require('./routes/users');

// Si vous avez d'autres routes, importez-les ici
// const authRoutes = require('./routes/authRoutes');

// Middlewares
app.use(cors()); // Activer CORS pour toutes les routes
app.use(express.json());

// Routes
app.use('/api/alerts', alertRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);

// app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
  res.send('Japap Backend is running!');
});

app.listen(port, () => {
  console.log(`🚀 Japap Backend listening on http://localhost:${port}`);
});
