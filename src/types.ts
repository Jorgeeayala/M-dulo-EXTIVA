export interface Cliente {
  id: string
  ruc: string
  nombre: string
}

export interface Config {
  delay: number
  prefix: string
  autologin: boolean
}

export interface ToastMessage {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

export interface AppState {
  currentScreen: string
  isLoggedIn: boolean
  credentials: { usuario: string; clave: string }
  clientes: Cliente[]
  selectedCliente: Cliente | null
  config: Config
}
