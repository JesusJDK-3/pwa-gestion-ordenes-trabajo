import { useState } from 'react'
import { Upload, CheckCircle2, AlertCircle, Loader2, FileUp } from 'lucide-react'
import type { ApiResponse } from '../../types'

interface CargaResult {
  message: string
  creadas: number
  duplicadas: number
  errores: number
  detalle: string[]
}

export default function CargarDatosGeograficos() {
  const [cargaVpa, setCargaVpa] = useState<{
    archivo: File | null
    cargando: boolean
    resultado: CargaResult | null
    error: string | null
  }>({
    archivo: null,
    cargando: false,
    resultado: null,
    error: null,
  })

  const [cargaHidrantes, setCargaHidrantes] = useState<{
    archivo: File | null
    cargando: boolean
    resultado: CargaResult | null
    error: string | null
  }>({
    archivo: null,
    cargando: false,
    resultado: null,
    error: null,
  })

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    tipo: 'vpa' | 'hidrantes'
  ) => {
    const file = e.target.files?.[0]
    if (file) {
      if (tipo === 'vpa') {
        setCargaVpa((prev) => ({ ...prev, archivo: file, resultado: null, error: null }))
      } else {
        setCargaHidrantes((prev) => ({ ...prev, archivo: file, resultado: null, error: null }))
      }
    }
  }

  const cargarArchivo = async (tipo: 'vpa' | 'hidrantes') => {
    const state = tipo === 'vpa' ? cargaVpa : cargaHidrantes
    const setState = tipo === 'vpa' ? setCargaVpa : setCargaHidrantes

    if (!state.archivo) {
      setState((prev) => ({ ...prev, error: 'Selecciona un archivo' }))
      return
    }

    const endpoint = tipo === 'vpa' ? '/api/admin/vpa/carga-excel' : '/api/admin/hidrantes/carga-excel'

    const formData = new FormData()
    formData.append('file', state.archivo)

    setState((prev) => ({ ...prev, cargando: true, error: null }))

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al cargar archivo')
      }

      const data: ApiResponse<CargaResult> = await response.json()
      setState((prev) => ({
        ...prev,
        resultado: data.data,
        cargando: false,
        archivo: null,
      }))
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Error desconocido',
        cargando: false,
      }))
    }
  }

  const ResultCard = ({
    title,
    data,
  }: {
    title: string
    data: CargaResult | null
  }) => {
    if (!data) return null

    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="text-green-600" size={20} />
          <h4 className="font-semibold text-green-700">{title} - Cargado</h4>
        </div>
        <div className="text-sm space-y-1 text-gray-700">
          <p>{data.message}</p>
          <p className="text-green-700 font-medium">✓ Creados: {data.creadas}</p>
          {data.duplicadas > 0 && (
            <p className="text-yellow-700">⚠ Duplicados: {data.duplicadas}</p>
          )}
          {data.errores > 0 && (
            <p className="text-red-700">✗ Errores: {data.errores}</p>
          )}
          {data.detalle.length > 0 && (
            <details className="mt-2 text-xs">
              <summary className="cursor-pointer font-semibold">Ver detalles</summary>
              <ul className="list-disc pl-5 mt-1 text-red-600">
                {data.detalle.slice(0, 5).map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
                {data.detalle.length > 5 && (
                  <li>... y {data.detalle.length - 5} más</li>
                )}
              </ul>
            </details>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* VPA */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileUp className="text-blue-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">Cargar VPA (Puntos de Agua)</h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo bd_vpa.xlsx
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Columnas esperadas: VCA, NIS, LONGITUD, LATITUD
          </p>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e, 'vpa')}
              disabled={cargaVpa.cargando}
              className="flex-1 text-sm text-gray-600 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
            />
          </div>
          {cargaVpa.archivo && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {cargaVpa.archivo.name} seleccionado
            </p>
          )}
        </div>

        <button
          onClick={() => cargarArchivo('vpa')}
          disabled={!cargaVpa.archivo || cargaVpa.cargando}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          {cargaVpa.cargando ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Cargando...
            </>
          ) : (
            <>
              <Upload size={18} />
              Cargar VPA
            </>
          )}
        </button>

        {cargaVpa.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-700">{cargaVpa.error}</p>
          </div>
        )}

        {cargaVpa.resultado && (
          <div className="mt-3">
            <ResultCard title="VPA" data={cargaVpa.resultado} />
          </div>
        )}
      </div>

      {/* HIDRANTES */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <FileUp className="text-green-600" size={24} />
          <h3 className="text-lg font-bold text-gray-800">Cargar Hidrantes</h3>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo bd_hidrantes.xlsx
          </label>
          <p className="text-xs text-gray-600 mb-3">
            Columnas esperadas: HIA, SUMINISTRO, DIRECCIÓN, LOCALIDAD, DISTRITO, SECTOR,
            LONGITUD, LATITUD
          </p>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => handleFileChange(e, 'hidrantes')}
              disabled={cargaHidrantes.cargando}
              className="flex-1 text-sm text-gray-600 file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
            />
          </div>
          {cargaHidrantes.archivo && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {cargaHidrantes.archivo.name} seleccionado
            </p>
          )}
        </div>

        <button
          onClick={() => cargarArchivo('hidrantes')}
          disabled={!cargaHidrantes.archivo || cargaHidrantes.cargando}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
        >
          {cargaHidrantes.cargando ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Cargando...
            </>
          ) : (
            <>
              <Upload size={18} />
              Cargar Hidrantes
            </>
          )}
        </button>

        {cargaHidrantes.error && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-3 flex gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-700">{cargaHidrantes.error}</p>
          </div>
        )}

        {cargaHidrantes.resultado && (
          <div className="mt-3">
            <ResultCard title="Hidrantes" data={cargaHidrantes.resultado} />
          </div>
        )}
      </div>

      {/* INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>📋 Nota:</strong> Carga primero los VPA e Hidrantes. Luego el Supervisor
          podrá subir las OT que se relacionarán automáticamente.
        </p>
      </div>
    </div>
  )
}
