import CargarDatosGeograficos from './CargarDatosGeograficos'

export default function CargarDatosPage() {
  return (
    <div className="space-y-6">
      <div className="page-header border-0 pb-0">
        <div>
          <p className="page-breadcrumb">Administrador · Datos maestros</p>
          <h1 className="page-title">Base geográfica VPA e Hidrantes</h1>
          <p className="page-subtitle">
            Carga estos<strong>archivos</strong> . La cual brinda las coordenadas designadas para conectar las (<em>OT</em>) .
          </p>
        </div>
      </div>
      <CargarDatosGeograficos />
    </div>
  )
}
