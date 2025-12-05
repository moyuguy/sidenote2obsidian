import { useState, useRef } from "react"
import { X, Command } from "lucide-react"
import clsx from "clsx"

import { normalizeKey } from "~utils/keyboard"

interface ShortcutInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export const ShortcutInput = ({ value, onChange, placeholder = "Press keys..." }: ShortcutInputProps) => {
  const [isRecording, setIsRecording] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Use our standardized utility
    const shortcut = normalizeKey(e)
    
    // Don't save modifier-only presses
    const parts = shortcut.split("+")
    const lastPart = parts[parts.length - 1]
    if (lastPart && ["meta", "ctrl", "alt", "shift"].includes(lastPart)) {
        return
    }

    onChange(shortcut)
    setIsRecording(false)
    inputRef.current?.blur()
  }

  return (
    <div className="relative">
      <div 
        className={clsx(
          "flex items-center gap-2 p-2 border rounded-lg bg-white transition-all cursor-pointer",
          isRecording 
            ? "border-violet-500 ring-2 ring-violet-100" 
            : "border-gray-200 hover:border-gray-300"
        )}
        onClick={() => {
          setIsRecording(true)
          inputRef.current?.focus()
        }}
      >
        <Command size={14} className={clsx("shrink-0", isRecording ? "text-violet-500" : "text-gray-400")} />
        
        <input
          ref={inputRef}
          type="text"
          value={isRecording ? "Press shortcut..." : value || ""}
          readOnly
          className="w-full text-sm bg-transparent border-0 p-0 focus:ring-0 cursor-pointer outline-none text-gray-700"
          placeholder={placeholder}
          onKeyDown={isRecording ? handleKeyDown : undefined}
          onBlur={() => setIsRecording(false)}
        />
        
        {value && !isRecording && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onChange("")
            }}
            className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500"
          >
            <X size={12} />
          </button>
        )}
      </div>
      {isRecording && (
        <div className="absolute top-full left-0 right-0 mt-1 z-10">
           <div className="bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg text-center">
             Listening...
           </div>
        </div>
      )}
    </div>
  )
}
