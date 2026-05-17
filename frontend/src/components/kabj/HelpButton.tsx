import { useState } from 'react'
import { X } from 'lucide-react'

export default function HelpButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-[#1A2535] text-white font-bold text-lg shadow-lg hover:bg-[#243347] flex items-center justify-center"
        aria-label="Ayuda"
      >
        {open ? <X size={18} /> : '?'}
      </button>

      {open && (
        <div className="fixed bottom-20 right-6 z-50 bg-white rounded-2xl shadow-card-hover border border-gray-100 p-5 w-72 animate-scale-in">
          <p className="font-semibold text-gray-800 mb-2 text-[15px]">Centro de Ayuda KABJ</p>
          <ul className="space-y-2 text-[13px] text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#CC1111] font-bold mt-0.5">•</span>
              Ante cualquier duda técnica, contacta al supervisor de turno.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#CC1111] font-bold mt-0.5">•</span>
              Emergencias: llamar al <strong className="text-gray-800">CCS SEDAPAL 317-8000</strong>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#CC1111] font-bold mt-0.5">•</span>
              Soporte técnico KABJ: <strong className="text-gray-800">soporte@kabj.pe</strong>
            </li>
          </ul>
          <div className="mt-3 pt-3 border-t border-gray-100 text-[12px] text-gray-400">
            Sistema de Operaciones de Campo v2.0
          </div>
        </div>
      )}
    </>
  )
}
