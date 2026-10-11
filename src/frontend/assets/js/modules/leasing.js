/* ══════════════════════════════════
   LEASING
══════════════════════════════════ */
const LEASING_TIPOS={
  '1en1':'Diodo (1 en 1)',
  '2en1':'Diodo + ND:YAG (2 en 1)',
  '3en1':'Diodo + ND:YAG + IPL (3 en 1)',
  '4en1':'Diodo + ND:YAG + IPL + RF (4 en 1)'
};
const LEASING_INICIAL_RANGO={min:1500,max:2500};
const LEASING_CUOTA_RANGO={min:20000,max:25000};
function leasingEstadoBadge(e){
  const m={activo:'badge-green',completado:'badge-blue',cancelado:'badge-red',vencido:'badge-yellow'};
  const l={activo:'Activo',completado:'Completado',cancelado:'Cancelado',vencido:'Vencido'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function leasingCuotaBadge(e){
  const m={pendiente:'badge-yellow',pagada:'badge-green',vencida:'badge-red'};
  const l={pendiente:'Pendiente',pagada:'Pagada',vencida:'Vencida'};
  return `<span class="badge ${m[e]||'badge-gray'}">${l[e]||e}</span>`;
}
function leasingProgreso(pagadas,total){
  const pct=total?Math.round((pagadas/total)*100):0;
  return `<div class="leasing-progress"><div class="leasing-progress-bar" style="width:${pct}%"></div><span>${pagadas}/${total} cuotas (${pct}%)</span></div>`;
}
async function renderLeasing(){
  const el=document.getElementById('leasingContent');if(!el)return;
  try{
    const [contratos,dash]=await Promise.all([
      api('/api/leasing'),
      api('/api/leasing/dashboard')
    ]);
    DB.set('leasing',contratos);
    el.innerHTML=`
      <div class="leasing-dashboard">
        <div class="leasing-kpi-grid">
          ${leasingKpi('📋','Activos',dash.activos,'accent')}
          ${leasingKpi('✅','Completados',dash.completados,'ok')}
          ${leasingKpi('❌','Cancelados',dash.cancelados,'danger')}
          ${leasingKpi('⏰','Cuotas pendientes',dash.cuotas_pendientes,'warn')}
          ${leasingKpi('🚨','Cuotas vencidas',dash.cuotas_vencidas,dash.cuotas_vencidas?'danger':'muted')}
          ${leasingKpi('💵','Cobrado (UYU)','$'+Number(dash.ingresos_cuotas_uyu||0).toLocaleString('es-UY'),'ok')}
          ${leasingKpi('💰','Iniciales (USD)','$'+Number(dash.ingresos_iniciales_usd||0).toLocaleString('es-UY'),'accent')}
        </div>
        ${dash.proximos_vencimientos?.length?`
        <div class="leasing-proxvenc">
          <h4>Próximos vencimientos</h4>
          <div class="leasing-venc-list">${dash.proximos_vencimientos.slice(0,5).map(c=>`
            <div class="leasing-venc-row">
              <span>Cuota ${c.numero_cuota}</span>
              <span>${fmtDate(c.fecha_vencimiento)}</span>
              <span>$${Number(c.monto_uyu).toLocaleString('es-UY')}</span>
            </div>`).join('')}
          </div>
        </div>`:''}
      </div>
      <div class="table-header" style="margin-top:20px">
        <h4>Contratos de Leasing</h4>
        <button class="btn-add" onclick="openLeasingModal()">+ Nuevo Leasing</button>
      </div>
      ${contratos.length?`<div style="overflow-x:auto"><table><thead><tr>
        <th>Código</th><th>Operadora</th><th>Máquina</th><th>Tipo</th>
        <th>Inicio</th><th>Progreso</th><th>Estado</th><th>Acciones</th>
      </tr></thead><tbody>${contratos.map(c=>`<tr>
        <td><span style="font-family:monospace;color:var(--accent)">${escapeHTML(c.codigo)}</span></td>
        <td>${escapeHTML(c.operadora_nombre)}</td>
        <td>${escapeHTML(c.maquina_codigo||'')} ${escapeHTML(c.descripcion_maquina||'')}</td>
        <td>${escapeHTML(LEASING_TIPOS[c.tipo_maquina]||c.tipo_maquina)}</td>
        <td>${fmtDate(c.fecha_inicio)}</td>
        <td>${leasingProgreso(c.cuotas_pagadas,c.plazo_meses)}</td>
        <td>${leasingEstadoBadge(c.estado)}</td>
        <td style="white-space:nowrap">
          <button class="action-btn" onclick="showLeasingFicha(${c.id})">Ver</button>
        </td>
      </tr>`).join('')}</tbody></table></div>`
      :`<div class="empty-state"><div class="icon">📋</div><h3>Sin contratos de leasing</h3><p>Creá el primer contrato de leasing</p></div>`}
    `;
  }catch(e){
    el.innerHTML=`<div class="empty-state"><div class="icon">⚠️</div><h3>Error al cargar leasing</h3><p>${escapeHTML(e.message)}</p></div>`;
  }
}
function leasingKpi(icon,label,value,tone){
  return `<div class="leasing-kpi ${tone||''}">
    <span class="leasing-kpi-icon">${icon}</span>
    <div><small>${escapeHTML(label)}</small><strong>${value}</strong></div>
  </div>`;
}
async function showLeasingFicha(id){
  navigate('leasing-ficha');
  const el=document.getElementById('fichaLeasingContent');if(!el)return;
  el.innerHTML='<div class="loading">Cargando...</div>';
  try{
    const [contrato,cuotas]=await Promise.all([
      api('/api/leasing/'+id),
      api('/api/leasing/'+id+'/cuotas')
    ]);
    const pct=contrato.plazo_meses?Math.round((contrato.cuotas_pagadas/contrato.plazo_meses)*100):0;
    el.innerHTML=`
      <div class="leasing-ficha-header">
        <div>
          <h2>${escapeHTML(contrato.codigo)}</h2>
          <p>${escapeHTML(contrato.operadora_nombre)} · ${escapeHTML(LEASING_TIPOS[contrato.tipo_maquina]||contrato.tipo_maquina)}</p>
          ${leasingEstadoBadge(contrato.estado)}
        </div>
        <div class="leasing-ficha-meta">
          <div><small>Máquina</small><strong>${escapeHTML(contrato.maquina_codigo||'')} ${escapeHTML(contrato.descripcion_maquina||'')}</strong></div>
          <div><small>Inicio</small><strong>${fmtDate(contrato.fecha_inicio)}</strong></div>
          <div><small>Fin previsto</small><strong>${fmtDate(contrato.fecha_fin)}</strong></div>
          <div><small>Pago inicial</small><strong>USD $${Number(contrato.pago_inicial_usd).toLocaleString('es-UY')}</strong></div>
          <div><small>Cuota mensual</small><strong>UYU $${Number(contrato.cuota_mensual_uyu).toLocaleString('es-UY')}</strong></div>
          <div><small>Ubicación</small><strong>${escapeHTML(contrato.ubicacion_estetica||contrato.ciudad||'—')}</strong></div>
        </div>
      </div>
      <div style="margin:16px 0">${leasingProgreso(contrato.cuotas_pagadas,contrato.plazo_meses)}</div>
      ${contrato.observaciones?`<div class="leasing-obs"><strong>Observaciones:</strong> ${escapeHTML(contrato.observaciones)}</div>`:''}
      ${contrato.estado==='activo'&&canEdit()?`<div style="margin:12px 0;display:flex;gap:8px">
        <button class="btn-secondary" onclick="cancelarLeasing(${id})">Cancelar contrato</button>
      </div>`:''}
      <h4 style="margin-top:20px">Cuotas (${contrato.cuotas_pagadas}/${contrato.plazo_meses})</h4>
      <div style="overflow-x:auto"><table><thead><tr>
        <th>#</th><th>Vencimiento</th><th>Monto</th><th>Estado</th><th>Fecha pago</th><th>Acciones</th>
      </tr></thead><tbody>${cuotas.map(c=>`<tr>
        <td>${c.numero_cuota}</td>
        <td>${fmtDate(c.fecha_vencimiento)}</td>
        <td>$${Number(c.monto_uyu).toLocaleString('es-UY')}</td>
        <td>${leasingCuotaBadge(c.estado)}</td>
        <td>${c.fecha_pago?fmtDate(c.fecha_pago):'—'}</td>
        <td>${c.estado!=='pagada'&&canEdit()?`<button class="action-btn" onclick="pagarCuotaLeasing(${c.id},${id})">Registrar pago</button>`:''}</td>
      </tr>`).join('')}</tbody></table></div>
    `;
  }catch(e){
    el.innerHTML=`<div class="empty-state"><div class="icon">⚠️</div><h3>Error</h3><p>${escapeHTML(e.message)}</p></div>`;
  }
}
async function pagarCuotaLeasing(cuotaId,leasingId){
  if(!confirm('¿Registrar el pago de esta cuota?'))return;
  try{
    await api('/api/leasing/cuotas/'+cuotaId+'/pagar',{method:'PATCH',body:JSON.stringify({metodo_pago:'efectivo'})});
    showToast('✅ Cuota registrada como pagada');
    showLeasingFicha(leasingId);
  }catch(e){showToast('❌ '+e.message,'error');}
}
async function cancelarLeasing(id){
  const motivo=prompt('Motivo de cancelación:');
  if(!motivo)return;
  try{
    await api('/api/leasing/'+id+'/cancelar',{method:'PATCH',body:JSON.stringify({motivo})});
    showToast('Contrato cancelado');
    showLeasingFicha(id);
  }catch(e){showToast('❌ '+e.message,'error');}
}
function openLeasingModal(id){
  const ops=DB.get('operadoras')||[];
  const maqs=(DB.get('maquinas')||[]).filter(m=>{
    const cat=(m.categoria||'').toLowerCase();
    const nom=(m.nombre||'').toLowerCase();
    const combo=cat+' '+nom;
    return /diodo|nd.?yag|ipl|depilaci|soprano|laser/i.test(combo);
  });
  const html=`<div class="modal-header"><h3>${id?'Editar':'Nuevo'} Contrato de Leasing</h3></div>
    <div class="modal-body">
      <input type="hidden" id="leasingId" value="${id||''}"/>
      <div class="form-row">
        <div class="form-group"><label>Operadora *</label>
          <select id="leasingOperadora" class="form-control">
            <option value="">Seleccionar...</option>
            ${ops.map(o=>`<option value="${o.id}" data-nombre="${escapeAttr(o.nombre||o.name||'')}">${escapeHTML(o.nombre||o.name||'')}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Máquina *</label>
          <select id="leasingMaquina" class="form-control">
            <option value="">Seleccionar...</option>
            ${maqs.map(m=>`<option value="${m.id}" data-codigo="${escapeAttr(m.codigo)}">${escapeHTML(m.codigo)} - ${escapeHTML(m.nombre)}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Tipo de máquina *</label>
          <select id="leasingTipo" class="form-control">
            ${Object.entries(LEASING_TIPOS).map(([k,v])=>`<option value="${k}">${escapeHTML(v)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"><label>Descripción</label>
          <input type="text" id="leasingDescripcion" class="form-control" placeholder="Ej: Diodo de escritorio 1200W"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Pago inicial (USD) *</label>
          <input type="number" id="leasingPagoInicial" class="form-control" min="1500" max="2500" step="100" value="1500"/>
        </div>
        <div class="form-group"><label>Cuota mensual (UYU) *</label>
          <input type="number" id="leasingCuotaMensual" class="form-control" min="20000" max="25000" step="1000" value="20000"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Fecha inicio *</label>
          <input type="date" id="leasingFechaInicio" class="form-control" value="${today()}"/>
        </div>
        <div class="form-group"><label>Plazo (meses)</label>
          <input type="number" id="leasingPlazo" class="form-control" value="24" min="1" max="60"/>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Ubicación estética</label>
          <input type="text" id="leasingUbicacion" class="form-control" placeholder="Dirección de la estética"/>
        </div>
        <div class="form-group"><label>Ciudad</label>
          <input type="text" id="leasingCiudad" class="form-control" placeholder="Ciudad"/>
        </div>
      </div>
      <div class="form-group"><label>Observaciones</label>
        <textarea id="leasingObs" class="form-control" rows="2"></textarea>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
      <button class="btn-add" onclick="saveLeasingContract()">Guardar</button>
    </div>`;
  openModal(html);
}
async function saveLeasingContract(){
  const id=gv('leasingId');
  const opSelect=document.getElementById('leasingOperadora');
  const maqSelect=document.getElementById('leasingMaquina');
  const opNombre=opSelect?.selectedOptions[0]?.dataset?.nombre||'';
  const maqCodigo=maqSelect?.selectedOptions[0]?.dataset?.codigo||'';
  const body={
    operadora_id:Number(gv('leasingOperadora')),
    operadora_nombre:opNombre,
    maquina_id:Number(gv('leasingMaquina')),
    maquina_codigo:maqCodigo,
    tipo_maquina:gv('leasingTipo'),
    descripcion_maquina:gv('leasingDescripcion'),
    pago_inicial_usd:Number(gv('leasingPagoInicial')),
    cuota_mensual_uyu:Number(gv('leasingCuotaMensual')),
    fecha_inicio:gv('leasingFechaInicio'),
    plazo_meses:Number(gv('leasingPlazo'))||24,
    ubicacion_estetica:gv('leasingUbicacion'),
    ciudad:gv('leasingCiudad'),
    observaciones:gv('leasingObs'),
  };
  if(!body.operadora_id||!body.maquina_id){showToast('⚠️ Seleccioná operadora y máquina','warn');return;}
  try{
    if(id){
      await api('/api/leasing/'+id,{method:'PATCH',body:JSON.stringify(body)});
      showToast('✅ Contrato actualizado');
    }else{
      await api('/api/leasing',{method:'POST',body:JSON.stringify(body)});
      showToast('✅ Contrato de leasing creado con 24 cuotas generadas');
    }
    closeModal();
    renderLeasing();
  }catch(e){showToast('❌ '+e.message,'error');}
}
