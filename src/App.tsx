import { useState, useEffect } from 'react'
import Header from './components/Header'
import LoginScreen from './components/LoginScreen'
import DashboardScreen from './components/DashboardScreen'
import IvaScreen from './components/IvaScreen'
import ProgressScreen from './components/ProgressScreen'
import ClientesScreen from './components/ClientesScreen'
import ConfigScreen from './components/ConfigScreen'
import Toast from './components/Toast'
import { Cliente, Config, ToastMessage } from './types'

const MESES_NOMBRES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('login')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [credentials, setCredentials] = useState({ usuario: '', clave: '' })
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [config, setConfig] = useState<Config>({
    delay: 2,
    prefix: 'IVA',
    autologin: false
  })
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [mesesSeleccionados, setMesesSeleccionados] = useState<number | 'custom'>(1)
  const [rangoCustom, setRangoCustom] = useState({ desde: '', hasta: '' })
  const [downloadProgress, setDownloadProgress] = useState({
    current: 0,
    total: 0,
    items: [] as Array<{ periodo: string, status: 'pending' | 'downloading' | 'done' | 'error' }>
  })

  // Cargar datos del localStorage
  useEffect(() => {
    const savedCredentials = localStorage.getItem('marangatu_credentials')
    const savedClientes = localStorage.getItem('marangatu_clientes')
    const savedConfig = localStorage.getItem('marangatu_config')

    if (savedCredentials) {
      setCredentials(JSON.parse(savedCredentials))
    }
    if (savedClientes) {
      setClientes(JSON.parse(savedClientes))
    }
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig))
    }
  }, [])

  const showToast = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }

  const handleLogin = (usuario: string, clave: string, remember: boolean) => {
    if (!usuario || !clave) {
      showToast('Ingresá usuario y clave', 'warning')
      return
    }

    // Simular login
    setCredentials({ usuario, clave })
    setIsLoggedIn(true)
    
    if (remember) {
      localStorage.setItem('marangatu_credentials', JSON.stringify({ usuario, clave }))
    } else {
      localStorage.removeItem('marangatu_credentials')
    }

    showToast('✅ Sesión iniciada correctamente', 'success')
    setCurrentScreen('dashboard')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentScreen('login')
    showToast('Sesión cerrada', 'info')
  }

  const handleAddCliente = (cliente: Cliente) => {
    const newClientes = [...clientes, { ...cliente, id: Date.now().toString() }]
    setClientes(newClientes)
    localStorage.setItem('marangatu_clientes', JSON.stringify(newClientes))
    showToast('Cliente agregado correctamente', 'success')
  }

  const handleDeleteCliente = (id: string) => {
    const newClientes = clientes.filter(c => c.id !== id)
    setClientes(newClientes)
    localStorage.setItem('marangatu_clientes', JSON.stringify(newClientes))
    showToast('Cliente eliminado', 'warning')
  }

  const handleSaveConfig = (newConfig: Config) => {
    setConfig(newConfig)
    localStorage.setItem('marangatu_config', JSON.stringify(newConfig))
    showToast('Configuración guardada', 'success')
    setCurrentScreen('dashboard')
  }

  const handleClearData = () => {
    if (confirm('¿Borrar todos los datos guardados? Esta acción no se puede deshacer.')) {
      localStorage.clear()
      setCredentials({ usuario: '', clave: '' })
      setClientes([])
      setConfig({ delay: 2, prefix: 'IVA', autologin: false })
      setIsLoggedIn(false)
      setCurrentScreen('login')
      showToast('Todos los datos han sido borrados', 'warning')
    }
  }

  // CORRECCIÓN DEL BUG: Función mejorada para calcular meses
  const getMesesList = () => {
    const meses: Array<{ anio: number, mes: number }> = []

    if (mesesSeleccionados === 'custom' as any) {
      if (!rangoCustom.desde || !rangoCustom.hasta) return []

      const [desdeA, desdeM] = rangoCustom.desde.split('-').map(Number)
      const [hastaA, hastaM] = rangoCustom.hasta.split('-').map(Number)

      if (desdeA > hastaA || (desdeA === hastaA && desdeM > hastaM)) {
        showToast('El rango "desde" debe ser anterior a "hasta"', 'warning')
        return []
      }

      let currentDate = new Date(desdeA, desdeM - 1, 1)
      const endDate = new Date(hastaA, hastaM - 1, 1)

      while (currentDate <= endDate && meses.length < 24) {
        meses.push({
          anio: currentDate.getFullYear(),
          mes: currentDate.getMonth() + 1
        })
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    } else {
      // Calcular N meses anteriores al mes actual
      const today = new Date()
      // Empezar desde el mes anterior al actual
      const startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)

      const cantidad = typeof mesesSeleccionados === 'number' ? mesesSeleccionados : 1
      for (let i = 0; i < cantidad; i++) {
        const currentDate = new Date(startDate.getFullYear(), startDate.getMonth() - i, 1)
        meses.push({
          anio: currentDate.getFullYear(),
          mes: currentDate.getMonth() + 1
        })
      }
    }

    return meses
  }

  const handleStartDownload = () => {
    if (!selectedCliente) {
      showToast('Seleccioná un cliente primero', 'warning')
      return
    }

    const meses = getMesesList()
    if (meses.length === 0) {
      showToast('Seleccioná al menos un período', 'warning')
      return
    }

    // Preparar items de descarga
    const items = meses.map(({ anio, mes }) => ({
      periodo: `${String(mes).padStart(2, '0')}/${anio}`,
      status: 'pending' as const
    }))

    setDownloadProgress({
      current: 0,
      total: items.length,
      items
    })

    setCurrentScreen('progress')
    showToast(`Iniciando descarga de ${items.length} formulario(s)`, 'info')

    // Simular proceso de descarga
    simulateDownload(items)
  }

  const simulateDownload = (items: typeof downloadProgress.items) => {
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex >= items.length) {
        clearInterval(interval)
        showToast('✅ Descarga completa', 'success')
        return
      }

      setDownloadProgress(prev => ({
        ...prev,
        current: currentIndex + 1,
        items: prev.items.map((item, idx) => {
          if (idx < currentIndex) return { ...item, status: 'done' }
          if (idx === currentIndex) return { ...item, status: 'downloading' }
          return item
        })
      }))

      currentIndex++
    }, config.delay * 1000)
  }

  const handleCancelDownload = () => {
    setCurrentScreen('iva')
    showToast('Descarga cancelada', 'warning')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Header 
        onConfigClick={() => setCurrentScreen('config')}
      />

      <main>
        {currentScreen === 'login' && (
          <LoginScreen
            savedCredentials={credentials}
            onLogin={handleLogin}
            onSessionActive={() => setCurrentScreen('dashboard')}
            isLoggedIn={isLoggedIn}
          />
        )}

        {currentScreen === 'dashboard' && (
          <DashboardScreen
            onToolClick={(tool: string) => {
              if (tool === 'iva') setCurrentScreen('iva')
            }}
            onLogout={handleLogout}
            onClientesClick={() => setCurrentScreen('clientes')}
          />
        )}

        {currentScreen === 'iva' && (
          <IvaScreen
            clientes={clientes}
            selectedCliente={selectedCliente}
            onSelectCliente={setSelectedCliente}
            onAddCliente={() => setCurrentScreen('clientes')}
            onBack={() => setCurrentScreen('dashboard')}
            mesesSeleccionados={mesesSeleccionados}
            onMesesChange={setMesesSeleccionados}
            rangoCustom={rangoCustom}
            onRangoChange={setRangoCustom}
            getMesesList={getMesesList}
            config={config}
            onStartDownload={handleStartDownload}
            mesesNombres={MESES_NOMBRES}
          />
        )}

        {currentScreen === 'progress' && (
          <ProgressScreen
            cliente={selectedCliente}
            progress={downloadProgress}
            config={config}
            onCancel={handleCancelDownload}
          />
        )}

        {currentScreen === 'clientes' && (
          <ClientesScreen
            clientes={clientes}
            onBack={() => setCurrentScreen(selectedCliente ? 'iva' : 'dashboard')}
            onAddCliente={handleAddCliente}
            onDeleteCliente={handleDeleteCliente}
          />
        )}

        {currentScreen === 'config' && (
          <ConfigScreen
            config={config}
            onBack={() => setCurrentScreen('dashboard')}
            onSave={handleSaveConfig}
            onClearData={handleClearData}
          />
        )}
      </main>

      <Toast messages={toasts} />
    </div>
  )
}

export default App
