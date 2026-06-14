import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#ECEFF1] p-6">
          <div className="corp-card max-w-md w-full p-8 text-center" role="alert">
            <AlertTriangle size={40} className="mx-auto text-[#C0392B] mb-4" aria-hidden />
            <h1 className="text-lg font-semibold text-slate-800 mb-2">Algo salió mal</h1>
            <p className="text-sm text-slate-600 mb-6">
              Ocurrió un error inesperado. Puede recargar la página o volver al inicio.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                className="btn-primary min-h-11 px-4"
                onClick={() => window.location.reload()}
              >
                Recargar
              </button>
              <button
                type="button"
                className="btn-outline min-h-11 px-4"
                onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
              >
                Ir al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
