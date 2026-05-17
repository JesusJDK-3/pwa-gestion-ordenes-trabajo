import { type DragEvent, type ChangeEvent, useState } from 'react'
import { ordenService } from '../../services/api'
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function CargarOT() {
  const [file,     setFile]     = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.endsWith('.xlsx')) {
      setFile(dropped); setResult(null); setError(null)
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
    setLoading(true); setError(null)
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
    <div className="max-w-2xl space-y-6">

      {/* Page title */}
      <div>
        <h1 className="text-[22px] font-bold text-gray-900">Cargar Órdenes de Trabajo</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Sube un archivo <strong>.xlsx</strong> con columnas: Código OT · Descripción · Latitud · Longitud · Dirección
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-[#CC1111] bg-[#FDECEA]'
            : file
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-gray-200 hover:border-[#CC1111]/50 hover:bg-gray-50'
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <FileSpreadsheet size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Excel</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null) }}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors mt-1"
            >
              <X size={12} /> Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
              dragging ? 'bg-[#FDECEA]' : 'bg-gray-100'
            }`}>
              <Upload size={28} className={dragging ? 'text-[#CC1111]' : 'text-gray-400'} />
            </div>
            <div>
              <p className="font-semibold text-gray-700">Arrastra tu archivo Excel aquí</p>
              <p className="text-sm text-gray-400 mt-1">o haz clic para seleccionar</p>
            </div>
            <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">.xlsx únicamente</span>
          </div>
        )}
        <input id="fileInput" type="file" accept=".xlsx" className="hidden" onChange={handleChange} />
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 text-red-700 rounded-xl px-4 py-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
      {result && (
        <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" />
          {result}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full flex items-center justify-center gap-2 bg-[#CC1111] hover:bg-[#AA0E0E] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Procesando…</>
        ) : (
          <><Upload size={16} /> Cargar al sistema</>
        )}
      </button>
    </div>
  )
}
