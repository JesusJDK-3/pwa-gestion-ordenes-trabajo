import { type DragEvent, type ChangeEvent, useState } from 'react'
import { ordenService } from '../../services/api'

export default function CargarOT() {
  const [file,    setFile]    = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<string | null>(null)
  const [error,   setError]   = useState<string | null>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.name.endsWith('.xlsx')) {
      setFile(dropped)
      setResult(null)
      setError(null)
    } else {
      setError('Solo se aceptan archivos .xlsx')
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (chosen) { setFile(chosen); setResult(null); setError(null) }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await ordenService.cargarExcel(file)
      setResult((data as { message: string }).message ?? 'Carga exitosa')
      setFile(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al cargar el archivo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Cargar Órdenes de Trabajo</h2>
      <p className="text-sm text-gray-500">
        Sube un archivo <strong>.xlsx</strong> con columnas: Código OT | Descripción | Latitud | Longitud | Dirección
      </p>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer ${
          dragging ? 'border-[#1D9E75] bg-green-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        <div className="text-4xl mb-3">📂</div>
        {file ? (
          <div>
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 font-medium">Arrastra tu archivo Excel aquí</p>
            <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          accept=".xlsx"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          ✅ {result}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 bg-[#1D9E75] hover:bg-[#178060] disabled:bg-green-200 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
      >
        {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? 'Cargando…' : 'Cargar al sistema'}
      </button>
    </div>
  )
}
