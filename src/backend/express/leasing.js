const express = require('express');
const pool = require('../utils/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

async function ensureLeasingTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leasing_contracts (
      id                  SERIAL PRIMARY KEY,
      codigo              VARCHAR(20) UNIQUE NOT NULL,
      operadora_id        INTEGER,
      operadora_nombre    VARCHAR(200),
      maquina_id          INTEGER,
      maquina_codigo      VARCHAR(50),
      tipo_maquina        VARCHAR(20) NOT NULL CHECK (tipo_maquina IN ('1en1','2en1','3en1','4en1')),
      descripcion_maquina TEXT,
      pago_inicial_usd    NUMERIC(10,2) NOT NULL,
      cuota_mensual_uyu   NUMERIC(10,2) NOT NULL,
      plazo_meses         INTEGER NOT NULL DEFAULT 24,
      fecha_inicio        DATE NOT NULL,
      fecha_fin           DATE NOT NULL,
      estado              VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','completado','cancelado','vencido')),
      cuotas_pagadas      INTEGER NOT NULL DEFAULT 0,
      ubicacion_estetica  TEXT,
      ciudad              VARCHAR(100),
      observaciones       TEXT,
      fecha_cancelacion   DATE,
      motivo_cancelacion  TEXT,
      penalizacion_usd    NUMERIC(10,2),
      created_at          TIMESTAMP DEFAULT NOW(),
      updated_at          TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leasing_payments (
      id                  SERIAL PRIMARY KEY,
      leasing_id          INTEGER NOT NULL REFERENCES leasing_contracts(id) ON DELETE CASCADE,
      numero_cuota        INTEGER NOT NULL,
      monto_uyu           NUMERIC(10,2) NOT NULL,
      fecha_vencimiento   DATE NOT NULL,
      fecha_pago          DATE,
      estado              VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagada','vencida')),
      metodo_pago         VARCHAR(100),
      comprobante         TEXT,
      observaciones       TEXT,
      created_at          TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureLeasingTables().catch(e => console.error('Error creando tablas leasing:', e.message));

// GET /api/leasing
router.get('/', auth, async (req, res) => {
  try {
    const { estado } = req.query;
    let q = 'SELECT * FROM leasing_contracts';
    const params = [];
    if (estado) { q += ' WHERE estado=$1'; params.push(estado); }
    q += ' ORDER BY created_at DESC';
    const { rows } = await pool.query(q, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/leasing/dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const { rows: contratos } = await pool.query('SELECT * FROM leasing_contracts');
    const activos = contratos.filter(c => c.estado === 'activo');
    const completados = contratos.filter(c => c.estado === 'completado').length;
    const cancelados = contratos.filter(c => c.estado === 'cancelado').length;

    let cuotas_pendientes = 0, cuotas_vencidas = 0, ingresos_cuotas_uyu = 0;
    let proximos_vencimientos = [];

    if (activos.length) {
      const ids = activos.map(c => c.id);
      const { rows: cuotas } = await pool.query(
        'SELECT * FROM leasing_payments WHERE leasing_id = ANY($1)', [ids]
      );
      const hoy = new Date().toISOString().slice(0, 10);
      cuotas_pendientes = cuotas.filter(c => c.estado === 'pendiente').length;
      cuotas_vencidas = cuotas.filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && c.fecha_vencimiento.toISOString().slice(0, 10) < hoy).length;
      ingresos_cuotas_uyu = cuotas.filter(c => c.estado === 'pagada').reduce((s, c) => s + Number(c.monto_uyu || 0), 0);
      proximos_vencimientos = cuotas
        .filter(c => c.estado === 'pendiente' && c.fecha_vencimiento && c.fecha_vencimiento.toISOString().slice(0, 10) >= hoy)
        .sort((a, b) => a.fecha_vencimiento - b.fecha_vencimiento)
        .slice(0, 10);
    }

    const ingresos_iniciales_usd = contratos.reduce((s, c) => s + Number(c.pago_inicial_usd || 0), 0);

    res.json({
      activos: activos.length, completados, cancelados,
      cuotas_pendientes, cuotas_vencidas,
      ingresos_cuotas_uyu, ingresos_iniciales_usd,
      proximos_vencimientos
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/leasing/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM leasing_contracts WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/leasing/:id/cuotas
router.get('/:id/cuotas', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM leasing_payments WHERE leasing_id=$1 ORDER BY numero_cuota', [req.params.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/leasing
router.post('/', auth, async (req, res) => {
  try {
    const { operadora_id, operadora_nombre, maquina_id, maquina_codigo,
      tipo_maquina, descripcion_maquina, pago_inicial_usd, cuota_mensual_uyu,
      fecha_inicio, plazo_meses = 24, ubicacion_estetica, ciudad, observaciones } = req.body;

    if (!operadora_id || !maquina_id || !tipo_maquina)
      return res.status(400).json({ error: 'operadora_id, maquina_id y tipo_maquina son obligatorios' });
    if (!pago_inicial_usd || !cuota_mensual_uyu)
      return res.status(400).json({ error: 'pago_inicial_usd y cuota_mensual_uyu son obligatorios' });
    if (!fecha_inicio)
      return res.status(400).json({ error: 'fecha_inicio es obligatorio' });

    const inicio = new Date(fecha_inicio);
    const fin = new Date(inicio);
    fin.setMonth(fin.getMonth() + plazo_meses);

    // Generate code
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as c FROM leasing_contracts');
    const codigo = 'LEA-' + String(Number(countRows[0].c) + 1).padStart(3, '0');

    const { rows } = await pool.query(`
      INSERT INTO leasing_contracts
        (codigo,operadora_id,operadora_nombre,maquina_id,maquina_codigo,tipo_maquina,
         descripcion_maquina,pago_inicial_usd,cuota_mensual_uyu,plazo_meses,
         fecha_inicio,fecha_fin,ubicacion_estetica,ciudad,observaciones)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING *
    `, [codigo, operadora_id, operadora_nombre, maquina_id, maquina_codigo,
      tipo_maquina, descripcion_maquina, pago_inicial_usd, cuota_mensual_uyu,
      plazo_meses, fecha_inicio, fin.toISOString().slice(0, 10),
      ubicacion_estetica, ciudad, observaciones]);

    const contrato = rows[0];

    // Generate payment schedule
    const values = [];
    const placeholders = [];
    for (let i = 1; i <= plazo_meses; i++) {
      const venc = new Date(inicio);
      venc.setMonth(venc.getMonth() + i);
      const idx = (i - 1) * 4;
      placeholders.push(`($${idx + 1},$${idx + 2},$${idx + 3},$${idx + 4})`);
      values.push(contrato.id, i, cuota_mensual_uyu, venc.toISOString().slice(0, 10));
    }
    if (placeholders.length) {
      await pool.query(
        `INSERT INTO leasing_payments (leasing_id,numero_cuota,monto_uyu,fecha_vencimiento) VALUES ${placeholders.join(',')}`,
        values
      );
    }

    res.status(201).json(contrato);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/leasing/:id
router.patch('/:id', auth, async (req, res) => {
  try {
    const fields = ['operadora_nombre', 'descripcion_maquina', 'ubicacion_estetica', 'ciudad', 'observaciones'];
    const sets = []; const vals = [];
    fields.forEach(f => {
      if (req.body[f] !== undefined) { sets.push(`${f}=$${vals.length + 1}`); vals.push(req.body[f]); }
    });
    if (!sets.length) return res.status(400).json({ error: 'Nada que actualizar' });
    sets.push(`updated_at=NOW()`);
    vals.push(req.params.id);
    const { rows } = await pool.query(
      `UPDATE leasing_contracts SET ${sets.join(',')} WHERE id=$${vals.length} RETURNING *`, vals
    );
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/leasing/:id/cancelar
router.patch('/:id/cancelar', auth, async (req, res) => {
  try {
    const { motivo, penalizacion } = req.body;
    const { rows } = await pool.query(`
      UPDATE leasing_contracts
      SET estado='cancelado', fecha_cancelacion=NOW(), motivo_cancelacion=$1,
          penalizacion_usd=$2, updated_at=NOW()
      WHERE id=$3 AND estado='activo' RETURNING *
    `, [motivo, penalizacion || null, req.params.id]);
    if (!rows.length) return res.status(400).json({ error: 'Contrato no encontrado o no está activo' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/leasing/:id/completar
router.patch('/:id/completar', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE leasing_contracts SET estado='completado', updated_at=NOW()
      WHERE id=$1 RETURNING *
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Contrato no encontrado' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/leasing/cuotas/:cuotaId/pagar
router.patch('/cuotas/:cuotaId/pagar', auth, async (req, res) => {
  try {
    const { metodo_pago, comprobante } = req.body;
    const { rows } = await pool.query(`
      UPDATE leasing_payments SET estado='pagada', fecha_pago=NOW(),
        metodo_pago=$1, comprobante=$2
      WHERE id=$3 AND estado!='pagada' RETURNING *
    `, [metodo_pago || 'efectivo', comprobante || null, req.params.cuotaId]);
    if (!rows.length) return res.status(400).json({ error: 'Cuota no encontrada o ya pagada' });
    const cuota = rows[0];

    // Update contract paid count
    await pool.query(`
      UPDATE leasing_contracts SET cuotas_pagadas=cuotas_pagadas+1, updated_at=NOW()
      WHERE id=$1
    `, [cuota.leasing_id]);

    // Check if all paid → complete
    const { rows: contract } = await pool.query('SELECT * FROM leasing_contracts WHERE id=$1', [cuota.leasing_id]);
    if (contract.length && contract[0].cuotas_pagadas >= contract[0].plazo_meses) {
      await pool.query("UPDATE leasing_contracts SET estado='completado', updated_at=NOW() WHERE id=$1", [cuota.leasing_id]);
    }

    res.json(cuota);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
