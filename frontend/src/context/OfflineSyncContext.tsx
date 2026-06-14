import { createContext, useContext, type ReactNode } from 'react'
import { useOfflineSyncState } from '../hooks/useOfflineSync'

type OfflineSyncValue = ReturnType<typeof useOfflineSyncState>

const OfflineSyncContext = createContext<OfflineSyncValue | null>(null)

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const value = useOfflineSyncState()
  return (
    <OfflineSyncContext.Provider value={value}>
      {children}
    </OfflineSyncContext.Provider>
  )
}

export function useOfflineSync(): OfflineSyncValue {
  const ctx = useContext(OfflineSyncContext)
  if (!ctx) throw new Error('useOfflineSync requiere OfflineSyncProvider')
  return ctx
}
