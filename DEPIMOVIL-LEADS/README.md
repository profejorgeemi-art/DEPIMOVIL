# DepiMóvil Leads

Módulo de gestión de Leads / Prospectos extraído del CRM DepiMóvil.

## Estructura

```
frontend/
  assets/
    css/leads.css         — Estilos de leads, embudo, kanban, notas, ficha 360
    js/modules/
      leads.js            — CRUD de leads, ficha detallada, filtros, scoring
      embudo.js           — Embudo comercial (kanban por estados)
      notas-leads.js      — Notas de seguimiento por lead
  views.html              — Vistas HTML (leads, lead-ficha, embudo)

backend/
  routes/leads.js         — API Express (CRUD leads, notas, scoring, conversión)
```

## Dependencias del CRM original

Los JS usan funciones globales del CRM:
- `api(method, url, body)` — llamadas autenticadas al backend
- `DB.get(key)` / `DB.set(key, val)` — localStorage cache
- `navigate(view)`, `showToast()`, `escapeHTML()`, `fmtDate()`
- `currentUser` — usuario logueado
- CSS variables: `--text`, `--surface`, `--accent`, `--border`, etc.

## Base de datos

Tabla `leads` en PostgreSQL (creada por el backend del CRM).
Tabla `lead_notas` para notas de seguimiento.

## Estados de un lead

nuevo → contactado → interesado → calificado → presupuesto_enviado →
pendiente_respuesta → pendiente_sena → reserva_confirmada → cliente_activa →
ganado / perdido / reactivar_luego / cliente_inactiva / recuperacion / seguimiento
