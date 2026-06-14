import type { Actividad } from '../types/kabj'

export const ACTIVIDADES: Actividad[] = [
  {
    id: 'A1',
    nombre: 'Purgado en Redes',
    codigo: 'A1',
    colorIcono: 'blue',
    totalOT: 23,
    activo: true,
    subtitulo: 'hasta Ø315 mm',
    subactividades: [
      {
        id: 'A1.37',
        nombre: 'Purgado en redes secundarias',
        tipo: 'Mantenimiento Correctivo',
        tiempoMaximo: 20,
        descripcion:
          'El purgado de redes secundarias consiste en la eliminación del aire y sedimentos acumulados en tuberías de distribución de agua potable, con diámetros hasta 315 mm. Este procedimiento garantiza la continuidad del servicio y la calidad del agua suministrada a los usuarios del sector.',
        pasos: [
          'Verificar la presión de red en el punto de intervención utilizando manómetro calibrado',
          'Señalizar el área de trabajo con conos y cinta de seguridad a 5 metros del punto de purga',
          'Localizar y abrir la válvula de purga manual o automática asignada en la OT',
          'Mantener abierta la válvula hasta obtener agua limpia y sin turbulencia (aprox. 3-5 min)',
          'Cerrar la válvula y verificar que no existan fugas residuales antes de retirar señalización',
        ],
        medidasSeguridad: [
          'Usar EPP completo: casco, guantes, chaleco reflectivo y botas dieléctricas',
          'Verificar ausencia de cables eléctricos en el área de intervención',
          'No operar válvulas sin previa autorización del supervisor de guardia',
          'Mantener distancia segura durante el purgado (agua a presión puede causar lesiones)',
        ],
        materiales: [
          'Manómetro de presión calibrado',
          'Llave de válvula T-35 o ajustable',
          'Conos de señalización vial (4 unidades)',
          'Cinta de seguridad amarilla (10 m)',
          'Tablet con acceso al sistema KABJ',
        ],
        recomendaciones: [
          'Siempre registrar la presión inicial y final en el sistema KABJ antes de cerrar la OT',
          'Si la turbidez persiste después de 10 minutos de purgado, notificar al supervisor de inmediato',
          'Evitar purgar en horas de máxima demanda (07:00–09:00 y 18:00–20:00)',
        ],
      },
      {
        id: 'A1.38',
        nombre: 'Purgado en redes primarias',
        tipo: 'Mantenimiento Preventivo',
        tiempoMaximo: 35,
        descripcion:
          'Operación de eliminación de aire y sedimentos en tuberías de distribución primaria con diámetros superiores a 315 mm. Requiere coordinación previa con el Centro de Control SEDAPAL antes de cualquier intervención.',
        pasos: [
          'Comunicar inicio de operación al Centro de Control SEDAPAL (CCS)',
          'Verificar presión mínima de 1.5 bar en el nodo de intervención',
          'Instalar señalización vial completa en radio de 10 metros',
          'Abrir válvula de purga gradualmente (25% → 50% → 100%) en intervalos de 2 minutos',
          'Monitorear presión durante el purgado; no bajar de 0.8 bar',
          'Al finalizar, cerrar válvula y comunicar fin de operación al CCS',
        ],
        medidasSeguridad: [
          'Requiere presencia de 2 técnicos como mínimo durante toda la operación',
          'Usar EPP completo según norma SEDAPAL G-001',
          'Mantener comunicación constante con CCS durante la operación',
          'Verificar que no haya usuarios sin servicio en tramos adyacentes',
        ],
        materiales: [
          'Manómetro de presión industrial (0–10 bar)',
          'Llave de válvula hidráulica T-50',
          'Kit de señalización vial completo',
          'Radio o celular corporativo',
          'Formato de registro de presiones',
        ],
        recomendaciones: [
          'Coordinar con CCS para apertura de válvulas sectoriales si la presión es insuficiente',
          'Documentar fotográficamente el estado del agua al inicio y al final del purgado',
        ],
      },
    ],
  },
  {
    id: 'A2',
    nombre: 'Cierre de Válvulas',
    codigo: 'A2',
    colorIcono: 'orange',
    totalOT: 15,
    activo: true,
    subtitulo: 'Tipo mariposa y compuerta',
    subactividades: [
      {
        id: 'A2.15',
        nombre: 'Cierre de válvula de seccionamiento',
        tipo: 'Operación Planificada',
        tiempoMaximo: 45,
        descripcion:
          'Cierre total o parcial de válvulas de seccionamiento para aislamiento de tramos de red durante trabajos de mantenimiento o reparación. Aplica a válvulas tipo compuerta, mariposa y esféricas de hasta 12 pulgadas.',
        pasos: [
          'Identificar la válvula en el plano GIS y verificar su estado en el sistema KABJ',
          'Notificar a los usuarios afectados con al menos 2 horas de anticipación (Área Comercial)',
          'Instalar señalización y equipo de seguridad en el área de trabajo',
          'Operar la válvula con la llave correspondiente de forma gradual (25% cada 2 min)',
          'Verificar corte de flujo con manómetro aguas abajo del punto de cierre',
          'Registrar hora de cierre y presión final en el sistema KABJ',
        ],
        medidasSeguridad: [
          'Verificar que la válvula no esté bajo presión excesiva antes de operar',
          'Usar fuerza controlada; no forzar válvulas atascadas sin reportar al supervisor',
          'Señalizar el buzón de acceso durante toda la operación',
          'No cerrar válvulas de más de 12" sin autorización escrita del jefe de operaciones',
        ],
        materiales: [
          'Llave de válvula tipo T (según diámetro)',
          'Manómetro de verificación',
          'Caja de herramientas básicas',
          'Tablet con acceso al sistema KABJ',
          'Kit de señalización vial',
        ],
        recomendaciones: [
          'Registrar el número exacto de vueltas para el cierre total (referencia para reapertura)',
          'Si la válvula presenta resistencia anormal, detener y reportar al supervisor',
          'Coordinar reapertura con CCS antes de terminar el turno',
        ],
      },
      {
        id: 'A2.16',
        nombre: 'Apertura de válvula de control',
        tipo: 'Operación Planificada',
        tiempoMaximo: 30,
        descripcion:
          'Apertura programada de válvulas de control para restablecer el suministro de agua potable en sectores que fueron aislados por mantenimiento o reparación de la red de distribución.',
        pasos: [
          'Verificar que los trabajos de mantenimiento en el tramo estén 100% concluidos',
          'Confirmar con CCS la autorización para la reapertura',
          'Purgar el tramo intervenido antes de la apertura total',
          'Abrir la válvula gradualmente verificando presión en tiempo real',
          'Confirmar restablecimiento del servicio con al menos 2 usuarios del sector',
        ],
        medidasSeguridad: [
          'Nunca abrir sin previa autorización del CCS',
          'Usar guantes y casco durante toda la operación',
          'Verificar que no existan trabajos pendientes en el tramo',
        ],
        materiales: [
          'Llave de válvula según diámetro',
          'Manómetro de presión',
          'Radio corporativo',
          'Tablet para registro',
        ],
        recomendaciones: [
          'Abrir de forma paulatina para evitar golpes de ariete en la red',
          'Registrar la presión de operación normal del sector tras la reapertura',
        ],
      },
    ],
  },
  {
    id: 'A3',
    nombre: 'Inspección de Conexiones',
    codigo: 'A3',
    colorIcono: 'purple',
    totalOT: 31,
    activo: true,
    subtitulo: 'Conexiones domiciliarias',
    subactividades: [
      {
        id: 'A3.08',
        nombre: 'Inspección de conexión domiciliaria',
        tipo: 'Inspección Técnica',
        tiempoMaximo: 25,
        descripcion:
          'Revisión técnica del estado de la conexión domiciliaria de agua potable, verificando la integridad de la caja de registro, válvula de control, medidor y empalme a la red de distribución según normativa SEDAPAL.',
        pasos: [
          'Ubicar la caja de registro del predio según coordenadas en el sistema KABJ',
          'Abrir la caja y verificar presencia de agua acumulada (indicador de fuga interna)',
          'Inspeccionar el estado de la válvula de control (herrumbre, deformación, apertura)',
          'Verificar el medidor: lectura actual, estado del sello y condición física exterior',
          'Fotografiar el estado general de la conexión con la tablet asignada',
          'Registrar hallazgos en el sistema y generar reporte de cierre de OT',
        ],
        medidasSeguridad: [
          'Usar guantes de látex o nitrilo durante toda la inspección',
          'Verificar ausencia de cables eléctricos cerca de la caja de registro',
          'No tocar el medidor si presenta signos de daño eléctrico o quemado',
          'Reportar inmediatamente fugas activas al centro de control',
        ],
        materiales: [
          'Linterna de inspección LED',
          'Guantes de nitrilo (par)',
          'Tablet para registro fotográfico',
          'Llave de apertura de caja de registro',
          'Cinta métrica para mediciones',
        ],
        recomendaciones: [
          'Registrar la lectura del medidor para cruce con datos comerciales SEDAPAL',
          'Si el medidor está detenido (no gira con agua abierta), generar OT de cambio',
          'Documentar cualquier modificación no autorizada de la instalación',
        ],
      },
    ],
  },
  {
    id: 'A4',
    nombre: 'Mantenimiento de Medidores',
    codigo: 'A4',
    colorIcono: 'green',
    totalOT: 18,
    activo: true,
    subtitulo: 'Cambio y verificación',
    subactividades: [
      {
        id: 'A4.22',
        nombre: 'Cambio de medidor dañado',
        tipo: 'Mantenimiento Correctivo',
        tiempoMaximo: 30,
        descripcion:
          'Reemplazo del medidor de agua potable dañado o con falla de lectura por una unidad nueva calibrada, incluyendo verificación de conexiones y prueba de funcionamiento in-situ.',
        pasos: [
          'Verificar la OT y datos del predio: dirección, tipo de medidor y diámetro de conexión',
          'Cerrar la válvula de control del predio antes de retirar el medidor',
          'Retirar el medidor dañado con la llave apropiada (anotar lectura final antes de retirar)',
          'Instalar el nuevo medidor verificando la dirección de flujo (flecha indicadora)',
          'Abrir lentamente la válvula y verificar ausencia de fugas en las uniones',
          'Registrar número de serie del medidor nuevo y lectura inicial en el sistema KABJ',
        ],
        medidasSeguridad: [
          'Nunca retirar el medidor sin antes cerrar completamente la válvula de control',
          'Usar llave de boca adecuada al tamaño; no usar pinzas o alicates para roscar',
          'Verificar que el medidor nuevo tenga sello de calibración vigente antes de instalar',
          'Proteger el área de trabajo de posibles salpicaduras durante el cambio',
        ],
        materiales: [
          'Medidor nuevo calibrado (según ficha de OT)',
          'Llave de boca 1" y 1½" (según tipo de conexión)',
          'Cinta teflón para juntas roscadas',
          'Trapo absorbente',
          'Tablet para registro en sistema KABJ',
        ],
        recomendaciones: [
          'Verificar que el medidor nuevo es exactamente del mismo diámetro que la conexión',
          'Tomar fotografía del medidor instalado con número de serie claramente visible',
          'El medidor retirado debe ser devuelto al almacén con su OT correspondiente',
        ],
      },
      {
        id: 'A4.23',
        nombre: 'Verificación de medidor en campo',
        tipo: 'Inspección Técnica',
        tiempoMaximo: 20,
        descripcion:
          'Verificación in-situ del correcto funcionamiento del medidor de agua instalado, comprobando precisión de lectura, estanqueidad y estado de los sellos de seguridad.',
        pasos: [
          'Registrar lectura inicial del medidor antes de realizar cualquier prueba',
          'Abrir completamente la válvula de paso y verificar giro continuo del disco medidor',
          'Verificar ausencia de fugas en la rosca de entrada y salida del medidor',
          'Comprobar integridad del sello de seguridad (no debe estar roto ni forzado)',
          'Registrar lectura final y calcular caudal aproximado en el sistema',
        ],
        medidasSeguridad: [
          'No forzar el giro del medidor manualmente',
          'Verificar que el área esté libre de obstáculos antes de abrir la válvula',
        ],
        materiales: [
          'Tablet para registro de lecturas',
          'Linterna de inspección',
          'Formulario de verificación SEDAPAL',
        ],
        recomendaciones: [
          'Comparar la lectura con el historial de consumo del usuario (datos SEDAPAL)',
          'Si se detecta consumo anómalo, generar alerta en el sistema para revisión comercial',
        ],
      },
    ],
  },
]
