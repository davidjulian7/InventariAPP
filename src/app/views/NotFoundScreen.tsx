import { useNavigate } from 'react-router'
import { Home } from 'lucide-react'

export function NotFoundScreen() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-6xl font-black text-primary mb-4">404</div>
      <h1 className="text-xl font-bold text-foreground mb-2">Página no encontrada</h1>
      <p className="text-muted-foreground text-sm mb-8 text-center">La ruta a la que intentas acceder no existe.</p>
      <button onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-secondary transition-colors cursor-pointer min-h-[48px]">
        <Home size={16} />Volver al inicio
      </button>
    </div>
  )
}
