import CargarDatosGeograficos from './CargarDatosGeograficos'

export default function CargarDatosPage() {
  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0">
        <div>
          <p className="page-breadcrumb">Administrador · Datos maestros</p>
          <h1 className="page-title">Base geográfica VPA e Hidrantes</h1>
          <p className="page-subtitle">
            Solo el <strong>administrador</strong> carga estos archivos. El supervisor importa después
            el Excel de mantenimiento (<em>carga mntto prev vpa</em>) para crear las OT.
          </p>
        </div>
      </div>
      <CargarDatosGeograficos />
    </div>
  )
}
