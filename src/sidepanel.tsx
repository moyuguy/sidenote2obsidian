import { useEffect, useState } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { Settings, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import clsx from "clsx"

import "./style.css"
import { SettingsView } from "~components/SettingsView"
import { CardList } from "~components/CardList"
import { CardEditor } from "~components/CardEditor"
import { checkObsidianStatus, createCard, generateFilename, generateContent, openObsidian } from "~utils/obsidian"
import { checkShortcut } from "~utils/keyboard"
import type { LocalCard, Template } from "~types"
import { DEFAULT_TEMPLATES, DEFAULT_SETTINGS } from "~types"
import { useI18n } from "~hooks/useI18n"

type View = "main" | "settings" | "editor"

function IndexSidePanel() {
  const { t } = useI18n()
  const [view, setView] = useState<View>("editor")
  
  // Storage
  const [apiKey] = useStorage("apiKey", "")
  const [apiUrl] = useStorage("apiUrl", "http://127.0.0.1:27123")
  const [savePath] = useStorage("savePath", "")
  
  // Data
  const [localCards, setLocalCards] = useStorage<LocalCard[]>("localCards", [])
  const [templates] = useStorage<Template[]>("templates", DEFAULT_TEMPLATES)
  const [shortcuts] = useStorage("shortcuts", DEFAULT_SETTINGS.shortcuts)
  const [autoSync] = useStorage("autoSync", DEFAULT_SETTINGS.autoSync)
  
  // Local state
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [selectedCard, setSelectedCard] = useState<LocalCard | null>(null)
  const [currentUrl, setCurrentUrl] = useState("")
  const [currentTitle, setCurrentTitle] = useState("")
  const [isUploadingMap, setIsUploadingMap] = useState<Record<string, boolean>>({})
  const [isUploadingAll, setIsUploadingAll] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Check if first time (no API key)
  const isFirstTime = !apiKey
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  // Load current tab info & Listen for changes
  useEffect(() => {
    const updateCurrentTab = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          setCurrentUrl(tabs[0].url)
          setCurrentTitle(tabs[0].title || "Untitled")
        }
      })
    }
    
    updateCurrentTab()
    
    const handleActivated = () => updateCurrentTab()
    const handleUpdated = (tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) => {
       if (tab.active && (changeInfo.url || changeInfo.title)) {
         updateCurrentTab()
       }
    }

    chrome.tabs.onActivated.addListener(handleActivated)
    chrome.tabs.onUpdated.addListener(handleUpdated)
    
    return () => {
      chrome.tabs.onActivated.removeListener(handleActivated)
      chrome.tabs.onUpdated.removeListener(handleUpdated)
    }
  }, [])

  // Check connection status
  useEffect(() => {
    const check = async () => {
      if (!apiKey) {
        setStatus("disconnected")
        setInitialCheckDone(true)
        return
      }
      const isConnected = await checkObsidianStatus(apiKey, apiUrl)
      setStatus(isConnected ? "connected" : "disconnected")
      setInitialCheckDone(true)
    }
    
    check()
    const interval = setInterval(check, 5000) // Check more frequently (5s)
    return () => clearInterval(interval)
  }, [apiKey, apiUrl])

  // Filter cards for current URL
  const currentCards = localCards.filter(c => c.sourceUrl === currentUrl || !c.sourceUrl)
    .sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime())

  const handleSelectCard = (card: LocalCard) => {
    setSelectedCard(card)
    setView("editor")
  }

  const handleNewCard = () => {
    setSelectedCard(null)
    setView("editor")
  }

  const handleEditorSave = () => {
    setView("main")
  }

  const handleEditorCancel = () => {
    setView("main")
    setSelectedCard(null)
  }
  
  const handleDeleteCard = (card: LocalCard) => {
    if (confirmDeleteId === card.id) {
      setLocalCards(localCards.filter(c => c.id !== card.id))
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(card.id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const performUpload = async (card: LocalCard): Promise<boolean> => {
    try {
      const template = templates.find(t => t.id === card.templateId) || templates[0]
      const filename = generateFilename(template.filenamePattern, card.title, card.sourceTitle)
      
      // Content already includes the full template (frontmatter + body) from the editor
      const success = await createCard(apiKey, apiUrl, savePath, filename, card.content)
      
      return success
    } catch (error) {
      console.error("Upload failed", error)
      return false
    }
  }

  const handleUploadCard = async (card: LocalCard) => {
    if (status !== "connected") {
      alert(t("connectFirst"))
      return
    }

    setIsUploadingMap(prev => ({ ...prev, [card.id]: true }))
    
    const success = await performUpload(card)
    
    if (success) {
      setLocalCards(prev => (prev || []).map(c => 
        c.id === card.id 
          ? { ...c, status: "synced", obsidianPath: "synced" } 
          : c
      ))
    } else {
      alert(t("syncFailed"))
    }
    
    setIsUploadingMap(prev => ({ ...prev, [card.id]: false }))
  }

  // Improved Upload All Logic
  const handleUploadAllImproved = async () => {
    if (status !== "connected") {
      alert(t("connectFirst"))
      return
    }
    
    const drafts = currentCards.filter(c => c.status === "draft")
    if (drafts.length === 0) return

    setIsUploadingAll(true)
    const successfulIds: string[] = []

    for (const card of drafts) {
       const success = await performUpload(card)
       if (success) {
         successfulIds.push(card.id)
       }
    }

    if (successfulIds.length > 0) {
      setLocalCards(prev => (prev || []).map(c => 
        successfulIds.includes(c.id) 
          ? { ...c, status: "synced", obsidianPath: "synced" } 
          : c
      ))
    }
    
    setIsUploadingAll(false)
  }

  // Global Shortcuts for Side Panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
       const currentShortcuts = shortcuts || DEFAULT_SETTINGS.shortcuts!
       
       // New Card
       if (view === "main" && checkShortcut(e, currentShortcuts.newCard)) {
         e.preventDefault()
         handleNewCard()
       }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [view, shortcuts])

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync?.enabled || !autoSync?.intervalMinutes || status !== "connected") {
      return
    }

    const intervalMs = autoSync.intervalMinutes * 60 * 1000
    const intervalId = setInterval(async () => {
      const drafts = (localCards || []).filter(c => c.status === "draft")
      if (drafts.length === 0) return

      for (const card of drafts) {
        await performUpload(card)
      }
      
      // Update status to synced
      setLocalCards(prev => (prev || []).map(c => 
        c.status === "draft" ? { ...c, status: "synced", obsidianPath: "synced" } : c
      ))
    }, intervalMs)

    return () => clearInterval(intervalId)
  }, [autoSync, status, localCards, templates, apiKey, apiUrl, savePath])

  // Initial Loading State
  if (!initialCheckDone) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500">
          <Loader2 className="animate-spin" size={32} />
          <p className="text-sm font-medium">{t("statusChecking") || "Connecting..."}</p>
        </div>
      </div>
    )
  }

  // Settings view
  if (view === "settings") {
    return (
      <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 p-4">
        <SettingsView onBack={() => setView("main")} />
      </div>
    )
  }
  
  // First-time setup
  if (isFirstTime) {
    return (
      <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 p-4">
        <SettingsView onBack={() => setView("main")} isFirstTime={true} />
      </div>
    )
  }

  // Editor view
  if (view === "editor") {
    return (
      <div className="h-screen w-full">
        <CardEditor
          card={selectedCard}
          sourceUrl={currentUrl}
          sourceTitle={currentTitle}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      </div>
    )
  }

  // Disconnected View (Overlay)
  if (status === "disconnected") {
     return (
       <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Header (Simplified) */}
          <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 opacity-60 pointer-events-none">
             <h1 className="text-lg font-bold text-violet-600 dark:text-violet-400">{t("appName")}</h1>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
             <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full">
               <AlertCircle size={48} className="text-red-500 dark:text-red-400" />
             </div>
             
             <div className="space-y-2">
               <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("statusDisconnected")}</h2>
               <p className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] mx-auto">
                 {t("connectFirst") || "Please open Obsidian to continue syncing your notes."}
               </p>
             </div>

             <div className="space-y-3 w-full max-w-[200px]">
               <button 
                 onClick={openObsidian}
                 className="w-full flex items-center justify-center gap-2 bg-violet-600 dark:bg-violet-700 text-white py-2.5 rounded-lg hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors font-medium text-sm"
               >
                 {/* Use chrome.runtime.getURL for assets in extension */}
                 <img src={chrome.runtime.getURL("assets/icon-32.png")} className="w-4 h-4 invert opacity-90" alt="" />
                 Open Obsidian
               </button>
               
               <button
                 onClick={() => setView("settings")}
                 className="w-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center justify-center gap-1"
               >
                 <Settings size={12} />
                 {t("settings")}
               </button>
             </div>
          </div>
       </div>
     )
  }

  // Main view
  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-violet-600 dark:text-violet-400">{t("appName")}</h1>
        
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <div
            className={clsx(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border transition-colors",
              status === "connected" 
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800" 
                : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
            )}
          >
            {status === "checking" ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            <span>{
              status === "connected" 
                ? t("statusConnected") 
                : t("statusChecking")
            }</span>
          </div>
          
          {/* Settings button */}
          <button 
            onClick={() => setView("settings")}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* Current page info */}
      <div className="px-4 py-2 bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
         <div className="text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[240px]">
           {currentTitle}
         </div>
      </div>

      {/* Card list */}
      <CardList
        cards={currentCards}
        isLoading={false}
        onSelectCard={handleSelectCard}
        onNewCard={handleNewCard}
        onDeleteCard={handleDeleteCard}
        onUploadCard={handleUploadCard}
        onUploadAll={handleUploadAllImproved}
        isUploadingMap={isUploadingMap}
        isUploadingAll={isUploadingAll}
        shortcutNewCard={shortcuts?.newCard || DEFAULT_SETTINGS.shortcuts?.newCard}
        confirmDeleteId={confirmDeleteId}
      />
    </div>
  )
}

export default IndexSidePanel
