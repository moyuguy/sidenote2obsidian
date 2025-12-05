import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import { X, CheckCircle, AlertCircle, Info } from "lucide-react"
import clsx from "clsx"

type ToastType = "success" | "error" | "info" | "confirm"

interface Toast {
  id: string
  type: ToastType
  message: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface ToastContextType {
  showToast: (type: "success" | "error" | "info", message: string) => void
  showConfirm: (message: string, onConfirm: () => void) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error("useToast must be used within ToastProvider")
  return context
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const showToast = (type: "success" | "error" | "info", message: string) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { id, type, message }])
    setTimeout(() => removeToast(id), 3000)
  }

  const showConfirm = (message: string, onConfirm: () => void) => {
    const id = crypto.randomUUID()
    setToasts(prev => [...prev, { 
      id, 
      type: "confirm", 
      message, 
      onConfirm: () => { onConfirm(); removeToast(id) },
      onCancel: () => removeToast(id)
    }])
  }

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={clsx(
              "flex items-center gap-3 p-3 rounded-lg shadow-lg animate-slide-up",
              toast.type === "success" && "bg-green-50 border border-green-200",
              toast.type === "error" && "bg-red-50 border border-red-200",
              toast.type === "info" && "bg-blue-50 border border-blue-200",
              toast.type === "confirm" && "bg-white border border-gray-200"
            )}
          >
            {toast.type === "success" && <CheckCircle size={18} className="text-green-500 flex-shrink-0" />}
            {toast.type === "error" && <AlertCircle size={18} className="text-red-500 flex-shrink-0" />}
            {toast.type === "info" && <Info size={18} className="text-blue-500 flex-shrink-0" />}
            {toast.type === "confirm" && <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />}
            
            <span className="flex-1 text-sm text-gray-700">{toast.message}</span>
            
            {toast.type === "confirm" ? (
              <div className="flex gap-2">
                <button 
                  onClick={toast.onCancel}
                  className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  {chrome.i18n.getMessage("cancel")}
                </button>
                <button 
                  onClick={toast.onConfirm}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                >
                  {chrome.i18n.getMessage("continue")}
                </button>
              </div>
            ) : (
              <button onClick={() => removeToast(toast.id)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
