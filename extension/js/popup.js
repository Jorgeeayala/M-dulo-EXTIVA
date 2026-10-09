'use strict';

const State = {
  mesesSeleccionados: 1,
  rangoDesde: null,
  rangoHasta: null,
  clienteSeleccionado: null,
  config: { delay: 2, prefix: 'IVA', autologin: false },
  clientesCatalog: [],
  searchResults: [],
  searchIndex: -1,
  _mesesTotales: []
};

const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getRucLoginValue(value) {
  const v = (value || '').trim();
  // Si viene con DV (ej: 1234567-8), para login usamos solo el numero base.
  const m = v.match(/^(\d+)-[\dkK]$/);
  return m ? m[1] : v;
}

document.addEventListener('DOMContentLoaded', async () => {
  initLogin();
  initDashboard();
  initIva();
  initConfig();
  initProgress();
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
  await loadStorage();
});

async function loadStorage() {
  const data = await chrome.storage.local.get(['config', 'credentials', 'clientesCatalog']);
  if (data.config) Object.assign(State.config, data.config);
  State.clientesCatalog = Array.isArray(data.clientesCatalog) ? data.clientesCatalog : [];

  if (data.credentials?.usuario) {
    document.getElementById('input-usuario').value = data.credentials.rucCompleto || data.credentials.usuario;
    document.getElementById('input-clave').value = data.credentials.clave || '';
    State.clienteSeleccionado = {
      id: 'current',
      ruc: data.credentials.rucCompleto || data.credentials.usuario,
      rucLogin: data.credentials.usuario,
      nombre: data.credentials.rucCompleto || data.credentials.usuario
    };
    showScreen('screen-dashboard');
  } else {
    showScreen('screen-login');
  }

  updateCsvStatus();
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

function initLogin() {
  const inputSearch = document.getElementById('input-search-cliente');
  const dropdown = document.getElementById('clientes-dropdown');

  inputSearch.addEventListener('input', () => {
    const query = inputSearch.value.trim().toLowerCase();
    if (!query) {
      hideDropdown();
      return;
    }

    State.searchResults = State.clientesCatalog.filter(c => {
      const ruc = (c.ruc || '').toLowerCase();
      const nombre = (c.nombre || '').toLowerCase();
      return ruc.includes(query) || nombre.includes(query);
    }).slice(0, 20);

    State.searchIndex = State.searchResults.length ? 0 : -1;
    renderDropdown();
  });

  inputSearch.addEventListener('keydown', e => {
    if (dropdown.classList.contains('hidden')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (State.searchResults.length) {
        State.searchIndex = Math.min(State.searchIndex + 1, State.searchResults.length - 1);
        renderDropdown();
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (State.searchResults.length) {
        State.searchIndex = Math.max(State.searchIndex - 1, 0);
        renderDropdown();
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (State.searchIndex >= 0 && State.searchResults[State.searchIndex]) {
        applySelectedClient(State.searchResults[State.searchIndex]);
      }
    }

    if (e.key === 'Escape') {
      hideDropdown();
    }
  });

  document.addEventListener('click', e => {
    if (!inputSearch.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  document.getElementById('btn-login').addEventListener('click', async () => {
    const usuarioInput = document.getElementById('input-usuario').value.trim();
    const clave = document.getElementById('input-clave').value.trim();

    if (!usuarioInput || !clave) {
      showToast('Ingresá usuario y clave', 'warning');
      return;
    }

    const usuarioLogin = getRucLoginValue(usuarioInput);

    await chrome.storage.local.set({
      credentials: {
        usuario: usuarioLogin,
        rucCompleto: usuarioInput,
        clave
      }
    });

    const catalogMatch = State.clientesCatalog.find(c => {
      const cr = (c.ruc || '').trim();
      return cr === usuarioInput || getRucLoginValue(cr) === usuarioLogin;
    });

    State.clienteSeleccionado = {
      id: 'current',
      ruc: usuarioInput,
      rucLogin: usuarioLogin,
      nombre: catalogMatch?.nombre || usuarioInput
    };

    chrome.runtime.sendMessage({
      action: 'OPEN_MARANGATU',
      credentials: { usuario: usuarioLogin, clave }
    });

    if (usuarioInput !== usuarioLogin) {
      showToast(`Login con RUC base: ${usuarioLogin}`, 'info');
    }
    showToast('Login inyectado', 'success');
    setTimeout(() => showScreen('screen-dashboard'), 900);
  });
}

function renderDropdown() {
  const dropdown = document.getElementById('clientes-dropdown');
  dropdown.innerHTML = '';

  if (!State.searchResults.length) {
    dropdown.innerHTML = '<div class="dropdown-empty">Sin resultados</div>';
    dropdown.classList.remove('hidden');
    return;
  }

  State.searchResults.forEach((client, idx) => {
    const item = document.createElement('div');
    item.className = `dropdown-item ${idx === State.searchIndex ? 'selected' : ''}`;
    item.innerHTML = `
      <span class="dropdown-item-ruc">${client.ruc || '-'}</span>
      <span class="dropdown-item-nombre">${client.nombre || 'Sin nombre'}</span>
    `;
    item.addEventListener('click', () => applySelectedClient(client));
    dropdown.appendChild(item);
  });

  dropdown.classList.remove('hidden');
}

function hideDropdown() {
  document.getElementById('clientes-dropdown').classList.add('hidden');
}

function applySelectedClient(client) {
  document.getElementById('input-search-cliente').value = `${client.nombre || ''} (${client.ruc || ''})`.trim();
  document.getElementById('input-usuario').value = client.ruc || '';
  document.getElementById('input-clave').value = client.clave || '';
  State.clienteSeleccionado = {
    id: 'catalog',
    ruc: client.ruc || '',
    rucLogin: getRucLoginValue(client.ruc || ''),
    nombre: client.nombre || client.ruc || ''
  };
  hideDropdown();
}

function initDashboard() {
  document.getElementById('tool-iva').onclick = async () => {
    await updateClienteInfo();
    updateMesesPreview();
    showScreen('screen-iva');
  };

  document.getElementById('btn-logout-dash').onclick = async () => {
    await chrome.storage.local.remove('credentials');
    State.clienteSeleccionado = null;
    document.getElementById('input-usuario').value = '';
    document.getElementById('input-clave').value = '';
    showToast('Sesion cerrada', 'info');
    showScreen('screen-login');
  };
}

function initIva() {
  document.getElementById('back-from-iva').onclick = () => showScreen('screen-dashboard');

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.onclick = function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      const val = this.dataset.meses;

      if (val === 'custom') {
        State.mesesSeleccionados = 'custom';
        document.getElementById('custom-range').classList.remove('hidden');
        setDefaultCustomRange();
      } else {
        State.mesesSeleccionados = parseInt(val, 10);
        document.getElementById('custom-range').classList.add('hidden');
      }
      updateMesesPreview();
    };
  });

  document.getElementById('range-desde').onchange = () => {
    State.rangoDesde = document.getElementById('range-desde').value;
    updateMesesPreview();
  };

  document.getElementById('range-hasta').onchange = () => {
    State.rangoHasta = document.getElementById('range-hasta').value;
    updateMesesPreview();
  };

  document.getElementById('btn-start-download').onclick = startDownload;
}

async function updateClienteInfo() {
  if (!State.clienteSeleccionado) {
    const data = await chrome.storage.local.get(['credentials']);
    if (data.credentials?.usuario) {
      const rucCompleto = data.credentials.rucCompleto || data.credentials.usuario;
      const rucLogin = data.credentials.usuario;
      const catalogMatch = State.clientesCatalog.find(c => {
        const cr = (c.ruc || '').trim();
        return cr === rucCompleto || getRucLoginValue(cr) === rucLogin;
      });
      State.clienteSeleccionado = {
        id: 'current',
        ruc: rucCompleto,
        rucLogin,
        nombre: catalogMatch?.nombre || rucCompleto
      };
    }
  }

  if (State.clienteSeleccionado) {
    document.getElementById('info-ruc').textContent = State.clienteSeleccionado.ruc;
  }
}

function getMesesList() {
  const meses = [];

  if (State.mesesSeleccionados === 'custom') {
    if (!State.rangoDesde || !State.rangoHasta) return [];

    const [desdeA, desdeM] = State.rangoDesde.split('-').map(Number);
    const [hastaA, hastaM] = State.rangoHasta.split('-').map(Number);
    if (desdeA > hastaA || (desdeA === hastaA && desdeM > hastaM)) return [];

    let currentDate = new Date(desdeA, desdeM - 1, 1);
    const endDate = new Date(hastaA, hastaM - 1, 1);

    while (currentDate <= endDate && meses.length < 24) {
      meses.push({ anio: currentDate.getFullYear(), mes: currentDate.getMonth() + 1 });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  } else {
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    for (let i = 0; i < State.mesesSeleccionados; i++) {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1);
      meses.push({ anio: d.getFullYear(), mes: d.getMonth() + 1 });
    }
  }

  return meses;
}

function updateMesesPreview() {
  const meses = getMesesList();
  const container = document.getElementById('meses-chips');
  container.innerHTML = '';

  if (!meses.length) {
    container.innerHTML = '<span class="mes-chip empty">Sin periodos seleccionados</span>';
    return;
  }

  meses.forEach(({ anio, mes }) => {
    const chip = document.createElement('span');
    chip.className = 'mes-chip';
    chip.textContent = `${MESES_NOMBRES[mes - 1]} ${anio}`;
    container.appendChild(chip);
  });

  if (State.clienteSeleccionado) {
    const { anio, mes } = meses[0];
    const baseName = State.clienteSeleccionado.nombre || State.clienteSeleccionado.ruc;
    document.getElementById('filename-preview').textContent =
      `${State.config.prefix}_${anio}_${String(mes).padStart(2, '0')}_${sanitizeFilename(baseName)}.pdf`;
  }
}

function setDefaultCustomRange() {
  const today = new Date();
  const hastaDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const desdeDate = new Date(hastaDate.getFullYear(), hastaDate.getMonth() - 2, 1);

  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const hasta = fmt(hastaDate);
  const desde = fmt(desdeDate);

  document.getElementById('range-hasta').value = hasta;
  document.getElementById('range-desde').value = desde;
  State.rangoHasta = hasta;
  State.rangoDesde = desde;
}

async function startDownload() {
  const meses = getMesesList();
  if (!meses.length) return showToast('Selecciona al menos un periodo', 'warning');

  const tabs = await chrome.tabs.query({ url: '*://marangatu.set.gov.py/*' });
  if (!tabs?.length) return showToast('Primero abri Marangatu logueado', 'warning');

  let ruc = State.clienteSeleccionado?.ruc;
  let nombreCliente = State.clienteSeleccionado?.nombre;
  if (!ruc) {
    const data = await chrome.storage.local.get(['credentials']);
    ruc = data.credentials?.rucCompleto || data.credentials?.usuario || document.getElementById('input-usuario').value.trim();
    const rucLoginTmp = data.credentials?.usuario || getRucLoginValue(ruc || '');
    const catalogMatch = State.clientesCatalog.find(c => {
      const cr = (c.ruc || '').trim();
      return cr === ruc || getRucLoginValue(cr) === rucLoginTmp;
    });
    nombreCliente = catalogMatch?.nombre || ruc;
  }
  if (!ruc) return showToast('No se encontro RUC', 'warning');

  const rucLogin = getRucLoginValue(ruc);

  if (!nombreCliente) {
    const catalogMatch = State.clientesCatalog.find(c => {
      const cr = (c.ruc || '').trim();
      return cr === ruc || getRucLoginValue(cr) === rucLogin;
    });
    nombreCliente = catalogMatch?.nombre || ruc;
  }

  State.clienteSeleccionado = { id: 'current', ruc, rucLogin, nombre: nombreCliente };
  State._mesesTotales = meses;

  document.getElementById('progress-cliente-nombre').textContent = nombreCliente;
  document.getElementById('progress-bar').style.width = '0%';
  document.getElementById('progress-text').textContent = `0 de ${meses.length}`;

  const listEl = document.getElementById('download-list');
  listEl.innerHTML = '';
  meses.forEach(({ anio, mes }) => {
    const item = document.createElement('div');
    item.className = 'download-item pending';
    item.id = `di-${anio}-${mes}`;
    item.innerHTML = `<span class="di-status">⏳</span><span class="di-name">${State.config.prefix}_${anio}_${String(mes).padStart(2, '0')}_${sanitizeFilename(nombreCliente)}.pdf</span>`;
    listEl.appendChild(item);
  });

  showScreen('screen-progress');

  chrome.runtime.sendMessage({
    action: 'START_IVA_DOWNLOAD',
    payload: {
      cliente: {
        ruc: rucLogin,
        nombre: nombreCliente
      },
      meses,
      selectionMode: State.mesesSeleccionados === 'custom' ? 'custom' : 'latest_available',
      selectionCount: typeof State.mesesSeleccionados === 'number' ? State.mesesSeleccionados : meses.length,
      config: State.config
    }
  });
}

function initProgress() {
  document.getElementById('btn-cancel-download').onclick = () => {
    chrome.runtime.sendMessage({ action: 'RESET_AUTOMATION' });
    showScreen('screen-iva');
    showToast('Cancelado', 'warning');
  };
}

function handleBackgroundMessage(msg) {
  switch (msg.action) {
    case 'LOGIN_SUCCESS':
      showToast('Sesion iniciada', 'success');
      showScreen('screen-dashboard');
      break;
    case 'PROGRESS_UPDATE':
      updateProgressUI(msg);
      break;
    case 'AUTOMATION_COMPLETE':
      document.getElementById('progress-bar').style.width = '100%';
      document.getElementById('progress-text').textContent = 'Listo';
      showToast('Descarga completa', 'success');
      break;
    case 'FORMULARIOS_ENCONTRADOS':
      showToast(`${msg.periodos?.length || 0} formulario(s) encontrado(s)`, 'info');
      break;
    case 'ERROR_AUTOMATIZACION':
      showToast(msg.error || 'Error de automatizacion', 'error');
      showScreen('screen-iva');
      break;
  }
}

function updateProgressUI(msg) {
  const done = msg.state?.mesesDescargados?.length ?? 0;
  const total = State._mesesTotales.length || 1;
  const pct = Math.round((done / total) * 100);

  document.getElementById('progress-bar').style.width = `${pct}%`;
  document.getElementById('progress-text').textContent = `${done} de ${total}`;

  State._mesesTotales.slice(0, done).forEach(({ anio, mes }) => {
    const item = document.getElementById(`di-${anio}-${mes}`);
    if (item && !item.classList.contains('done')) {
      item.className = 'download-item done';
      item.querySelector('.di-status').textContent = '✅';
    }
  });

  if (msg.index !== undefined && msg.index < State._mesesTotales.length) {
    const { anio, mes } = State._mesesTotales[msg.index] || {};
    if (anio) {
      const item = document.getElementById(`di-${anio}-${mes}`);
      if (item && item.classList.contains('pending')) {
        item.className = 'download-item downloading';
        item.querySelector('.di-status').textContent = '⬇️';
      }
    }
  }
}

function initConfig() {
  document.getElementById('btn-config').onclick = () => {
    document.getElementById('cfg-delay').value = State.config.delay;
    document.getElementById('cfg-prefix').value = State.config.prefix;
    document.getElementById('cfg-autologin').checked = State.config.autologin;
    updateCsvStatus();
    showScreen('screen-config');
  };

  document.getElementById('back-from-config').onclick = () => showScreen('screen-dashboard');

  document.getElementById('btn-save-config').onclick = async () => {
    State.config.delay = parseInt(document.getElementById('cfg-delay').value, 10) || 2;
    State.config.prefix = document.getElementById('cfg-prefix').value.trim() || 'IVA';
    State.config.autologin = document.getElementById('cfg-autologin').checked;
    await chrome.storage.local.set({ config: State.config });
    showToast('Configuracion guardada', 'success');
    showScreen('screen-dashboard');
  };

  document.getElementById('btn-import-csv').onclick = () => {
    document.getElementById('input-csv-file').click();
  };

  document.getElementById('input-csv-file').addEventListener('change', async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.length) {
      updateCsvStatus('CSV vacio o formato invalido', true);
      return;
    }
    State.clientesCatalog = parsed;
    await chrome.storage.local.set({ clientesCatalog: parsed });
    updateCsvStatus(`Importados ${parsed.length} clientes`);
    showToast(`Importados ${parsed.length} clientes`, 'success');
    e.target.value = '';
  });

  document.getElementById('btn-export-csv').onclick = async () => {
    if (!State.clientesCatalog.length) {
      showToast('No hay clientes para exportar', 'warning');
      return;
    }
    const rows = ['RUC,Nombre,Clave'];
    State.clientesCatalog.forEach(c => {
      rows.push(`${escapeCsv(c.ruc)},${escapeCsv(c.nombre)},${escapeCsv(c.clave)}`);
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    await chrome.downloads.download({
      url,
      filename: `clientes_marangatu_${new Date().toISOString().slice(0, 10)}.csv`,
      saveAs: true
    });
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  document.getElementById('btn-clear-all').onclick = async () => {
    if (!confirm('Borrar todos los datos guardados?')) return;
    await chrome.storage.local.clear();
    State.clienteSeleccionado = null;
    State.clientesCatalog = [];
    State.config = { delay: 2, prefix: 'IVA', autologin: false };
    document.getElementById('input-usuario').value = '';
    document.getElementById('input-clave').value = '';
    document.getElementById('input-search-cliente').value = '';
    showToast('Datos borrados', 'warning');
    showScreen('screen-login');
  };
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const hasHeader = lines[0].toLowerCase().includes('ruc') && lines[0].toLowerCase().includes('clave');
  const body = hasHeader ? lines.slice(1) : lines;

  const delimiter = detectCsvDelimiter(lines[0]);

  return body.map(line => parseCsvLine(line, delimiter)).filter(Boolean).map(cols => ({
    ruc: (cols[0] || '').trim(),
    nombre: (cols[1] || '').trim(),
    clave: (cols[2] || '').trim()
  })).filter(c => c.ruc && c.clave);
}

function parseCsvLine(line, delimiter = ',') {
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      cols.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  cols.push(current);
  return cols.length >= 3 ? cols : null;
}

function detectCsvDelimiter(sampleLine) {
  const commaCount = (sampleLine.match(/,/g) || []).length;
  const semicolonCount = (sampleLine.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
}

function escapeCsv(value = '') {
  const v = String(value);
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function updateCsvStatus(message = '', isError = false) {
  const el = document.getElementById('csv-status');
  if (!el) return;
  if (message) {
    el.style.color = isError ? 'var(--red)' : 'var(--text-muted)';
    el.textContent = message;
    return;
  }
  el.style.color = 'var(--text-muted)';
  el.textContent = State.clientesCatalog.length
    ? `${State.clientesCatalog.length} clientes en catalogo`
    : 'Sin clientes importados';
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function sanitizeFilename(name) {
  return (name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_ ]/g, '')
    .replace(/\s+/g, '_')
    .toUpperCase()
    .substring(0, 35);
}