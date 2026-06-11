import { type DragEvent, type ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordenService, type CargaExcelResult } from '../../services/api'
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Navigation } from 'lucide-react'

export default function CargarOT() {
  const [file,     setFile]     = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<CargaExcelResult | null>(null)
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
    setLoading(true); setError(null); setResult(null)
    try {
      const { data } = await ordenService.cargarExcel(file)
      const payload = (data as { data?: CargaExcelResult }).data
      setResult(payload ?? { message: 'Carga exitosa' })
      setFile(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al cargar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const tieneCoordsPendientes = (result?.coordenadasInvalidas ?? 0) > 0
    || (result?.coordenadasRevisar ?? 0) > 0

  return (
    <div className="max-w-2xl space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Carga de órdenes de trabajo</h1>
          <p className="page-subtitle">
            Archivo Excel (.xlsx) con SGIO, dirección y columnas <strong>LATITUD</strong> / <strong>LONGITUD</strong>
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
        className={`corp-card border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
          dragging
            ? 'border-[#0F4C81] bg-blue-50/50'
            : file
              ? 'border-emerald-300 bg-emerald-50/40'
              : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded flex items-center justify-center">
              <FileSpreadsheet size={24} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{file.name}</p>
              <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setFile(null) }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 mt-1"
            >
              <X size={12} /> Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded flex items-center justify-center ${dragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
              <Upload size={24} className={dragging ? 'text-[#0F4C81]' : 'text-slate-400'} />
            </div>
            <div>
              <p className="font-medium text-slate-700">Arrastre el archivo Excel o haga clic para seleccionar</p>
              <p className="text-sm text-slate-400 mt-1">Formatos SEDAPAL o Mantenimiento Preventivo VPA</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded">.xlsx</span>
          </div>
        )}
        <input id="fileInput" type="file" accept=".xlsx" className="hidden" onChange={handleChange} />
      </div>

      {error && (
        <div className="alert-banner alert-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {result && (
        <div className="corp-card p-4 space-y-3">
          <div className="alert-banner alert-success border-0 bg-transparent p-0">
            <CheckCircle2 size={16} />
            {result.message}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded p-2 border border-slate-100">
              <p className="font-bold text-slate-800">{result.creadas ?? 0}</p>
              <p className="text-slate-500">Creadas</p>
            </div>
            <div className="bg-emerald-50 rounded p-2 border border-emerald-100">
              <p className="font-bold text-emerald-700">{result.coordenadasValidas ?? 0}</p>
              <p className="text-emerald-600">Coords. válidas</p>
            </div>
            <div className="bg-amber-50 rounded p-2 border border-amber-100">
              <p className="font-bold text-amber-700">{result.coordenadasRevisar ?? 0}</p>
              <p className="text-amber-600">A revisar</p>
            </div>
            <div className="bg-red-50 rounded p-2 border border-red-100">
              <p className="font-bold text-red-700">{result.coordenadasInvalidas ?? 0}</p>
              <p className="text-red-600">Inválidas</p>
            </div>
          </div>

          {result.detalleCoordenadas && result.detalleCoordenadas.length > 0 && (
            <div className="border border-amber-200 rounded bg-amber-50/60 p-3 max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-amber-800 mb-2">Detalle de coordenadas</p>
              <ul className="space-y-1 text-xs text-amber-900">
                {result.detalleCoordenadas.map((d, i) => (
                  <li key={i}><span className="font-mono font-semibold">{d.sgio}</span> — {d.mensaje}</li>
                ))}
              </ul>
            </div>
          )}

          {tieneCoordsPendientes && (
            <Link to="/supervisor/coordenadas" className="btn-primary text-sm inline-flex">
              <Navigation size={15} />
              Corregir coordenadas en el sistema
            </Link>
          )}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="btn-primary w-full py-3"
      >
        {loading ? (
          <><Loader2 size={16} className="animate-spin" /> Procesando…</>
        ) : (
          <><Upload size={16} /> Importar al sistema</>
        )}
      </button>
    </div>
  )
}
