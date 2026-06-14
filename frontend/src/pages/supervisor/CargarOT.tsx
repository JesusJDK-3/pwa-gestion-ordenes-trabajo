import { type DragEvent, type ChangeEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordenService, type CargaExcelResult, type PreviewFilaExcel } from '../../services/api'
import { unwrapData } from '../../utils/apiParse'
import { Upload, FileSpreadsheet, X, CheckCircle2, AlertCircle, Loader2, Navigation, Eye } from 'lucide-react'

export default function CargarOT() {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<CargaExcelResult | null>(null)
  const [result, setResult] = useState<CargaExcelResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reset = () => { setPreview(null); setResult(null); setError(null) }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped?.name.match(/\.(xlsx|xls)$/i)) {
      setFile(dropped); reset()
    } else {
      setError('Solo se aceptan archivos .xlsx o .xls')
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files?.[0]
    if (chosen) { setFile(chosen); reset() }
  }

  const handlePreview = async () => {
    if (!file) return
    setLoading(true); setError(null); setPreview(null); setResult(null)
    try {
      const { data } = await ordenService.previewExcel(file)
      const payload = unwrapData<CargaExcelResult>(data)
      if (!payload) throw new Error('Respuesta vacía del servidor')
      setPreview(payload)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al previsualizar el archivo')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmar = async () => {
    if (!file) return
    setLoading(true); setError(null)
    try {
      const { data } = await ordenService.cargarExcel(file)
      const payload = unwrapData<CargaExcelResult>(data)
      setResult(payload ?? { message: 'Carga exitosa' })
      setPreview(null)
      setFile(null)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Error al confirmar la importación')
    } finally {
      setLoading(false)
    }
  }

  const filas = preview?.filas ?? []
  const yaImportado = (preview?.validas ?? 0) === 0 && (preview?.errores ?? 0) > 0 && filas.length > 0
  const sinFilas = preview && filas.length === 0
  const tieneCoordsPendientes = (result?.coordenadasInvalidas ?? 0) > 0
    || (result?.coordenadasRevisar ?? 0) > 0

  return (
    <div className="max-w-4xl space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Carga de órdenes de trabajo</h1>
          <p className="page-subtitle">
            <strong>Rol Supervisor:</strong> previsualice el Excel, revise filas en verde/rojo y confirme la importación.
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
        className={`corp-card border-2 border-dashed p-10 text-center transition-all cursor-pointer ${
          dragging ? 'border-[#0F4C81] bg-blue-50/50' : file ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileSpreadsheet size={24} className="text-emerald-600" />
            <p className="font-semibold text-slate-800">{file.name}</p>
            <button onClick={e => { e.stopPropagation(); setFile(null); reset() }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500">
              <X size={12} /> Quitar archivo
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={24} className="text-slate-400" />
            <p className="font-medium text-slate-700">Arrastre el Excel o haga clic para seleccionar</p>
            <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded">.xlsx · .xls</span>
          </div>
        )}
        <input id="fileInput" type="file" accept=".xlsx,.xls" className="hidden" onChange={handleChange} />
      </div>

      {error && (
        <div className="alert-banner alert-error"><AlertCircle size={16} />{error}</div>
      )}

      {yaImportado && (
        <div className="alert-banner alert-warning text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            Este Excel <strong>ya fue importado</strong> ({preview?.errores} OT duplicadas).
            Los datos están en el sistema — vaya a{' '}
            <Link to="/supervisor/asignar" className="underline font-semibold">Asignación de cuadrillas</Link>.
          </span>
        </div>
      )}

      {sinFilas && (
        <div className="alert-banner alert-error text-sm">
          <AlertCircle size={16} />
          No se leyeron filas del Excel. Use el archivo <em>carga mntto prev vpa.xlsx</em>.
        </div>
      )}

      {preview && filas.length > 0 && (
        <div className="corp-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 text-sm">Previsualización ({preview.validas ?? 0} válidas · {preview.errores ?? 0} errores)</h2>
          </div>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs uppercase text-slate-500">
                  {['Fila', 'Código OT', 'Punto', 'Estado', 'Mensaje'].map(h => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filas.map((f: PreviewFilaExcel) => (
                  <tr key={f.fila} className={f.valido ? 'bg-emerald-50/50' : 'bg-red-50/60'}>
                    <td className="px-4 py-2">{f.fila}</td>
                    <td className="px-4 py-2 font-mono font-semibold text-[#1B4F72]">{f.sgio}</td>
                    <td className="px-4 py-2 text-slate-600 max-w-[180px] truncate">{f.direccion ?? '—'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${f.valido ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {f.valido ? 'OK' : 'ERROR'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-slate-600">{f.mensaje}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && (
        <div className="corp-card p-4 space-y-3">
          <div className="alert-banner alert-success border-0 bg-transparent p-0">
            <CheckCircle2 size={16} />{result.message}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-50 rounded p-2"><p className="font-bold">{result.creadas ?? 0}</p><p className="text-slate-500">Creadas</p></div>
            <div className="bg-emerald-50 rounded p-2"><p className="font-bold text-emerald-700">{result.coordenadasValidas ?? 0}</p><p className="text-emerald-600">Coords. válidas</p></div>
            <div className="bg-amber-50 rounded p-2"><p className="font-bold text-amber-700">{result.coordenadasRevisar ?? 0}</p><p className="text-amber-600">A revisar</p></div>
            <div className="bg-red-50 rounded p-2"><p className="font-bold text-red-700">{result.coordenadasInvalidas ?? 0}</p><p className="text-red-600">Inválidas</p></div>
          </div>
          {tieneCoordsPendientes && (
            <Link to="/supervisor/coordenadas" className="btn-primary text-sm inline-flex">
              <Navigation size={15} /> Corregir coordenadas
            </Link>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handlePreview} disabled={!file || loading}
          className="btn-outline flex-1 py-3 disabled:opacity-50">
          {loading && !preview ? <><Loader2 size={16} className="animate-spin" /> Analizando…</> : <><Eye size={16} /> Previsualizar</>}
        </button>
        <button onClick={handleConfirmar} disabled={!file || !preview || loading || yaImportado}
          className="btn-primary flex-1 py-3 disabled:opacity-50">
          {loading && preview ? <><Loader2 size={16} className="animate-spin" /> Importando…</> : <><Upload size={16} /> Confirmar importación</>}
        </button>
      </div>
    </div>
  )
}
