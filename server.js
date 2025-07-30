import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/movimientos')
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => console.error('❌ Error al conectar a MongoDB:', err));

// Esquema y modelo
const movimientoSchema = new mongoose.Schema({
  sensor: String,
  movimiento: Boolean,
  timestamp: Number,
  confidence: Number,
  deviceId: String
});
const Movimiento = mongoose.model('Movimiento', movimientoSchema);

// Ruta POST protegida
app.post('/api/movimiento', async (req, res) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(403).json({ error: 'Clave API inválida' });
  }

  try {
    const nuevoMovimiento = new Movimiento(req.body);
    await nuevoMovimiento.save();
    console.log('📥 Movimiento recibido y guardado:', req.body);
    res.status(200).json({ message: 'Movimiento guardado correctamente' });
  } catch (err) {
    console.error('❌ Error al guardar movimiento:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor de Movimiento funcionando ✅');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});
