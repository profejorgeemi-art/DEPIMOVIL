/**
 * DepiMóvil API — Servidor principal
 * 
 * Ejecutar:
 *   npm start        (producción)
 *   npm run dev      (desarrollo con auto-reload)
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ensureAuthTables = require('./utils/ensure_auth_tables');

const app = express();
app.set('trust proxy', 1); // Trust Nginx proxy
const PORT = process.env.PORT || 3004;

// ══════════════════════════════════
// SEGURIDAD
// ══════════════════════════════════
app.use(helmet());

// CORS — permitir CRM admin y portal de operadoras
const allowedOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    // Permitir requests sin origin (apps móviles, curl, etc.)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // En desarrollo, permitir localhost
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) return cb(null, true);
    cb(new Error('Bloqueado por CORS'));
  },
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 2000, // el CRM carga muchos módulos y puede superar 200 en uso normal
  message: { error: 'Demasiadas solicitudes, intentá en unos minutos' },
});
app.use('/api/', limiter);

// Rate limit más estricto para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de login' },
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/whatsapp/request', loginLimiter);
app.use('/api/auth/whatsapp/verify', loginLimiter);

// Body parsing
app.use(express.json({ limit: '5mb' }));

// Defensa en profundidad contra HTML/JavaScript inyectado: el texto que llega desde la web no puede llevar < ni >.
// (No se toca la contraseña, los tokens ni la firma; tampoco los webhooks de WhatsApp.)
const CLAVES_SIN_LIMPIAR = /pass|token|firma|secret|codigo|data_url/i;
function sinEtiquetas(v, key) {
  if (typeof v === 'string') return CLAVES_SIN_LIMPIAR.test(key || '') ? v : v.replace(/[<>]/g, '');
  if (Array.isArray(v)) return v.map(x => sinEtiquetas(x, key));
  if (v && typeof v === 'object') { for (const k of Object.keys(v)) v[k] = sinEtiquetas(v[k], k); return v; }
  return v;
}
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object' && !req.path.startsWith('/api/webhook')) sinEtiquetas(req.body);
  next();
});
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));

// ══════════════════════════════════
// RUTAS
// ══════════════════════════════════
app.use('/api/auth', require('./routes/auth'));
app.use('/api/operadoras', require('./routes/operadoras'));
app.use('/api/portal', require('./routes/portal'));
app.use('/api/maquinas', require('./routes/maquinas'));
app.use('/api/mantenimientos', require('./routes/mantenimientos'));
app.use('/api/limpiezas', require('./routes/limpiezas'));
app.use('/api/reservas', require('./routes/reservas'));
app.use('/api/pagos', require('./routes/pagos'));
app.use('/api/finanzas', require('./routes/finanzas'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/envios', require('./routes/envios'));
app.use('/api/transportistas', require('./routes/transportistas'));
app.use('/api/webhook/whatsapp', require('./routes/whatsapp'));
app.use('/api/contratos', require('./routes/contratos'));
app.use('/api/permisos', require('./routes/permisos'));
app.use('/api/automatizaciones', require('./routes/automatizaciones'));
app.use('/api/leasing', require('./routes/leasing'));

// Health check
app.get('/api/health', (req, res) => {
  const wa = require('./utils/wa_watchdog').getStatus();
  res.json({ 
    status: wa.down ? 'degradado' : 'ok', 
    whatsapp: { estado: wa.state, desde: wa.since ? new Date(wa.since).toISOString() : null, requiereVincular: wa.needsRelink },
    service: 'depimovil-api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 para rutas API no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado' });
});

// Error handler global
app.use((err, req, res, next) => {
  if (err && err.message === 'Bloqueado por CORS') {
    // Origen no permitido: respuesta limpia, sin stack en los logs
    return res.status(403).json({ error: 'Origen no permitido' });
  }
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido' });
  }
  console.error('❌ Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

ensureAuthTables().catch(err => console.error('⚠️ ensure_auth_tables:', err.message));

// ══════════════════════════════════
// INICIO
// ══════════════════════════════════
app.listen(PORT, async () => {
  console.log(`
  ╔═══════════════════════════════════════╗
  ║   DepiMóvil API v1.0                  ║
  ║   Puerto: ${PORT}                         ║
  ║   Entorno: ${process.env.NODE_ENV || 'development'}             ║
  ╚═══════════════════════════════════════╝
  `);

  // Cola de mensajes WhatsApp, vigilante de conexión y programador de recordatorios/resúmenes
  // (este bloque se había perdido en una edición anterior del server.js y la automatización quedó apagada)
  try {
    await require('./utils/wa_queue').ensureTable();
    console.log('✅ Tabla wa_queue lista');
  } catch (err) {
    console.error('⚠️ wa_queue:', err.message);
  }

  try {
    const recordatorios = require('./recordatorios');
    require('./utils/wa_watchdog').iniciar({ onReconnect: recordatorios.procesarColaAutomatica });
    recordatorios.iniciarRecordatorios();
  } catch (err) {
    console.error('⚠️ Recordatorios/vigilante WhatsApp:', err.message);
  }
});

module.exports = app;
