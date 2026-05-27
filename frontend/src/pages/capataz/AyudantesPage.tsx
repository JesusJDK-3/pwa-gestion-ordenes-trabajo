import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { trabajadorService, safeInput } from '../../services/api'
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'

type Miembro = {
  idTrabajador: number
  dni?: string
  nombres: string
  apellidos: string
  cargo?: string
}

export default function AyudantesPage() {
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [dni, setDni] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    trabajadorService.listar()
      .then(r => {
        const data = (r.data as any)?.data ?? []
        setMiembros(Array.isArray(data) ? data : [])
      })
      .catch(() => setError('No se pudieron cargar los ayudantes. Intenta de nuevo.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!nombres.trim() || !apellidos.trim()) {
      setError('Ingresa nombres y apellidos del ayudante.')
      return
    }

    setSaving(true)
    try {
      const payload: any = {
        dni: safeInput(dni, 12),
        nombres: safeInput(nombres, 100),
        apellidos: safeInput(apellidos, 100),
        cargo: 'Ayudante',
      }
      const r = await trabajadorService.crear(payload)
      const data = (r.data as any)?.data ?? {}
      const nuevoMiembro: Miembro = {
        idTrabajador: data.idTrabajador ?? Date.now(),
        dni: data.dni,
        nombres: data.nombres ?? nombres,
        apellidos: data.apellidos ?? apellidos,
        cargo: data.cargo ?? cargo,
      }
      setMiembros(prev => [...prev, nuevoMiembro])
      setMessage('Ayudante registrado correctamente.')
      setDni('')
      setNombres('')
      setApellidos('')
      setCargo('')
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error al registrar el ayudante.'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#CC1111]/20 focus:border-[#CC1111] transition-all bg-white'

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/capataz" className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-300 transition-all bg-white shadow-card">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-[20px] font-bold text-gray-900">Registrar ayudantes</h1>
          <p className="text-sm text-gray-500">Agrega ayudantes para seleccionarlos en el formulario de actividad.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">DNI</label>
            <input
              type="text"
              value={dni}
              onChange={e => setDni(e.target.value)}
              placeholder="Ej. 12345678"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Cargo</label>
            <input
              type="text"
              value="Ayudante"
              readOnly
              className={`${inputClass} bg-gray-100 cursor-not-allowed`}
            />
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nombres</label>
            <input
              type="text"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              placeholder="Nombres"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Apellidos</label>
            <input
              type="text"
              value={apellidos}
              onChange={e => setApellidos(e.target.value)}
              placeholder="Apellidos"
              className={inputClass}
            />
          </div>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="inline mr-2" />
            {error}
          </div>
        )}
        {message && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm">
            <CheckCircle2 size={16} className="inline mr-2" />
            {message}
          </div>
        )}
        <button type="submit" disabled={saving} className="w-full bg-[#CC1111] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors hover:bg-[#AA0E0E]">
          {saving ? 'Guardando…' : 'Registrar ayudante'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Ayudantes registrados</h2>
            <p className="text-xs text-gray-500">Estos ayudantes aparecerán en el formulario de actividad.</p>
          </div>
          <span className="text-sm text-gray-500">{miembros.length} total</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : miembros.length === 0 ? (
          <p className="text-sm text-gray-500">Aún no tienes ayudantes registrados.</p>
        ) : (
          <ul className="space-y-3">
            {miembros.map(miembro => (
              <li key={miembro.idTrabajador} className="border border-gray-200 rounded-2xl p-4">
                <p className="font-semibold text-gray-800">{miembro.nombres} {miembro.apellidos}</p>
                <p className="text-xs text-gray-500">DNI: {miembro.dni ?? '—'}</p>
                <p className="text-xs text-gray-500">Cargo: {miembro.cargo ?? '—'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
