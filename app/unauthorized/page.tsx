import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex h-screen items-center justify-center text-center px-4">
      <div>
        <h1 className="text-4xl font-bold text-red-600 mb-4">401 - No autorizado</h1>
        <p className="text-lg text-gray-700 mb-6">
          No tenés permisos para acceder a esta página.
        </p>
        <Button>
          <a href="/auth">
            Ir al login
          </a>
        </Button>
      </div>
    </div>
  )
}
