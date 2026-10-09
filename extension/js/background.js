// ============================================================
// MARANGATU PRO - Background Service Worker (CORREGIDO)
// ============================================================

function applyExtensionIcon() {
  chrome.action.setIcon({
    path: {
      16: 'icons/icon16.png',
      24: 'icons/icon24.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    }
  }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  applyExtensionIcon();
});

chrome.runtime.onStartup.addListener(() => {
  applyExtensionIcon();
});

// Intento inmediato al despertar el service worker.
applyExtensionIcon();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {

    case 'OPEN_MARANGATU':
      abrirYLoguear(message.credentials);
      sendResponse({ ok: true });
      break;

    case 'START_IVA_DOWNLOAD':
      const { cliente, meses, config, selectionMode, selectionCount } = message.payload;
      iniciarDescargaEnTab({
        cliente,
        cantidadMeses: meses.length,
        meses,
        selectionMode,
        selectionCount,
        config
      });
      sendResponse({ ok: true });
      break;

    case 'INICIAR_DESCARGA_IVA':
      iniciarDescargaEnTab(message.state);
      sendResponse({ ok: true });
      break;

    case 'FORMULARIOS_ENCONTRADOS':
      notifyPopup({ action: 'FORMULARIOS_ENCONTRADOS', periodos: message.periodos });
      sendResponse({ ok: true });
      break;

    case 'ABRIR_SIGUIENTE_FORMULARIO':
      abrirSiguienteFormulario(message.state);
      sendResponse({ ok: true });
      break;

    case 'OPEN_FORMULARIO_TAB':
      abrirFormularioEnUltimaPosicion(message.href);
      sendResponse({ ok: true });
      break;

    case 'DESCARGANDO_FORMULARIO':
      notifyPopup({
        action: 'PROGRESS_UPDATE',
        state: {
          mesesDescargados: Array.from({ length: message.index }, (_, i) => i),
          mesesPendientes: Array.from({ length: message.total - message.index }, (_, i) => i)
        },
        periodo: message.periodo,
        index: message.index,
        total: message.total
      });
      sendResponse({ ok: true });
      break;

    case 'FORMULARIO_GUARDADO':
      const done = message.index + 1;
      notifyPopup({
        action: 'PROGRESS_UPDATE',
        state: {
          mesesDescargados: Array.from({ length: done }, (_, i) => i),
          mesesPendientes: Array.from({ length: message.total - done }, (_, i) => i)
        },
        index: message.index,
        total: message.total
      });
      sendResponse({ ok: true });
      break;

    case 'DESCARGA_COMPLETA':
      notifyPopup({ action: 'AUTOMATION_COMPLETE' });
      sendResponse({ ok: true });
      break;

    case 'ERROR_AUTOMATIZACION':
      notifyPopup({ action: 'ERROR_AUTOMATIZACION', error: message.error });
      sendResponse({ ok: true });
      break;

    case 'RESET_AUTOMATION':
      chrome.storage.local.remove('marangatu_pro_automation');
      sendResponse({ ok: true });
      break;
  }
  return true;
});

// ═══════════════════════════════════════════════════════════
// Abrir Marangatu e inyectar credenciales
// ═══════════════════════════════════════════════════════════
async function abrirYLoguear(credentials) {
  const URL_LOGIN = 'https://marangatu.set.gov.py/';

  const tabs = await chrome.tabs.query({ url: '*://marangatu.set.gov.py/*' });
  let tab;
  let needsNavigation = false;

  if (tabs.length > 0) {
    tab = tabs[0];
    await chrome.tabs.update(tab.id, { active: true });
    needsNavigation = !tab.url || tab.url === 'about:blank';
    if (needsNavigation) {
      await chrome.tabs.reload(tab.id);
    }
  } else {
    tab = await chrome.tabs.create({ url: URL_LOGIN, active: true });
    needsNavigation = true;
  }

  const sendInject = () => {
    chrome.tabs.sendMessage(tab.id, {
      action: 'INYECTAR_LOGIN',
      credentials
    }).catch(() => {
      // Reintento breve por si content script aun no esta listo
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'INYECTAR_LOGIN',
          credentials
        }).catch(() => {});
      }, 400);
    });
  };

  // Si no hubo navegación, inyectar inmediatamente.
  if (!needsNavigation) {
    setTimeout(sendInject, 120);
    return;
  }

  // Esperar que la tab cargue y luego inyectar
  const listener = (tabId, info) => {
    if (tabId !== tab.id || info.status !== 'complete') return;
    chrome.tabs.onUpdated.removeListener(listener);

    // Espera corta para que content script este listo
    setTimeout(sendInject, 200);
  };

  chrome.tabs.onUpdated.addListener(listener);
}

// ═══════════════════════════════════════════════════════════
// Iniciar descarga en tab de Marangatu
// ═══════════════════════════════════════════════════════════
async function iniciarDescargaEnTab(state) {
  const tabs = await chrome.tabs.query({ url: '*://marangatu.set.gov.py/*' });
  // Priorizar la tab activa del usuario para flujo situacional.
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeMarangatu = activeTabs.find(t => t.url && t.url.includes('marangatu.set.gov.py'));

  const dashTab = activeMarangatu || tabs.find(t => !t.url.includes('login')) || tabs[0];

  if (!dashTab) {
    notifyPopup({
      action: 'ERROR_AUTOMATIZACION',
      error: 'No hay ninguna tab de Marangatu abierta. Iniciá sesión primero.'
    });
    return;
  }

  await chrome.tabs.update(dashTab.id, { active: true });
  
  chrome.tabs.sendMessage(dashTab.id, { 
    action: 'INICIAR_DESCARGA_IVA', 
    state 
  }).catch(() => {
    notifyPopup({
      action: 'ERROR_AUTOMATIZACION',
      error: 'No se pudo comunicar con la página de Marangatu. Refrescá la página.'
    });
  });
}

// ═══════════════════════════════════════════════════════════
// Abrir siguiente formulario
// ═══════════════════════════════════════════════════════════
async function abrirSiguienteFormulario(state) {
  const tabs = await chrome.tabs.query({ url: '*://marangatu.set.gov.py/*' });
  if (tabs.length === 0) return;

  // Encontrar la tab de lista (la más antigua)
  tabs.sort((a, b) => a.id - b.id);
  const listaTab = tabs[0];

  await chrome.tabs.update(listaTab.id, { active: true });
  
  chrome.tabs.sendMessage(listaTab.id, { 
    action: 'ABRIR_SIGUIENTE_FORMULARIO', 
    state 
  }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// Notificar al popup
// ═══════════════════════════════════════════════════════════
function notifyPopup(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // El popup puede estar cerrado, no es un error crítico
  });
}

async function abrirFormularioEnUltimaPosicion(href) {
  if (!href) return;
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const maxIndex = tabs.length ? Math.max(...tabs.map(t => t.index)) : 0;
  await chrome.tabs.create({ url: href, active: true, index: maxIndex + 1 });
}
