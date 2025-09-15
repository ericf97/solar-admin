"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

type AlertOptions = {
  title: string
  description: string
  onConfirm?: () => void
}

type AlertContextType = {
  showAlert: (title: string, description: string, onConfirm?: () => void) => void
}

const AlertContext = createContext<AlertContextType | undefined>(undefined)

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertOptions | null>(null)

  const showAlert = (title: string, description: string, onConfirm?: () => void) => {
    setAlert({ title, description, onConfirm })
  }

  const handleConfirm = () => {
    alert?.onConfirm?.()
    setAlert(null)
  }

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <div className="fixed bottom-4 right-4 w-80">
          <Alert variant="default">
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
            <button
              className="mt-2 rounded bg-blue-600 px-3 py-1 text-white"
              onClick={handleConfirm}
            >
              OK
            </button>
          </Alert>
        </div>
      )}
    </AlertContext.Provider>
  )
}

export function useAlert() {
  const ctx = useContext(AlertContext)
  if (!ctx) throw new Error("useAlert must be used inside <AlertProvider>")
  return ctx.showAlert
}
