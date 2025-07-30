import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.API_KEY;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch((err) => console.error('❌ Error al conectar a MongoDB:', err));

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


function formatearFecha(timestamp) {
  const fecha = new Date(timestamp);
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const anio = fecha.getFullYear();

  let horas = fecha.getHours();
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  const segundos = fecha.getSeconds().toString().padStart(2, '0');

  const ampm = horas >= 12 ? 'p.m.' : 'a.m.';
  horas = horas % 12;
  horas = horas ? horas : 12;
  const horasStr = horas.toString().padStart(2, '0');

  return `${dia}/${mes}/${anio}, ${horasStr}:${minutos}:${segundos} ${ampm}`;
}


// Nueva ruta GET para obtener los últimos movimientos
app.get('/api/datos', async (req, res) => {
  try {
    const movimientos = await Movimiento.find()
      .sort({ timestamp: -1 })
      .limit(20);

    const movimientosFormateados = movimientos.map(mov => ({
      ...mov.toObject(),
      fechaFormateada: formatearFecha(mov.timestamp),
    }));

    res.json(movimientosFormateados);
  } catch (err) {
    console.error('❌ Error al obtener los datos:', err);
    res.status(500).json({ error: 'Error al obtener los datos' });
  }
});



// Ruta de prueba
app.get('/', (req, res) => {
  res.send('Servidor de Movimiento funcionando ✅');
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor corriendo en http://localhost:${PORT}`);
});
