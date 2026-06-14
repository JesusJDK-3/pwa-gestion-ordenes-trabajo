import { useOfflineSync } from '../context/OfflineSyncContext'



export default function BannerOffline() {

  const { isOnline, pendingCount, lastSyncMsg } = useOfflineSync()



  if (isOnline && !lastSyncMsg) return null



  if (!isOnline) {

    return (

      <div className="bg-red-600 text-white text-center text-sm py-2 px-4 font-medium z-50">

        Sin conexión — los datos se guardarán localmente

        {pendingCount > 0 ? ` · ${pendingCount} pendiente${pendingCount > 1 ? 's' : ''}` : ''}

      </div>

    )

  }



  if (lastSyncMsg) {

    return (

      <div className="bg-emerald-600 text-white text-center text-sm py-2 px-4 font-medium z-50 animate-in fade-in">

        ✓ {lastSyncMsg}

      </div>

    )

  }



  return null

}

