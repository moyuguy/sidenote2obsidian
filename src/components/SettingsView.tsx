import { useStorage } from "@plasmohq/storage/hook"
import { useEffect, useState } from "react"
import { ArrowLeft, Plus, Trash2, HelpCircle, ExternalLink, Keyboard, Star, Globe } from "lucide-react"
import clsx from "clsx"

import { checkObsidianStatus, openObsidian, getVaultFolders } from "~utils/obsidian"
import { DEFAULT_TEMPLATES, DEFAULT_SETTINGS, type Template } from "~types"
import { ShortcutInput } from "~components/ShortcutInput"
import { useI18n } from "~hooks/useI18n"
import { getDefaultTemplates } from "~defaults"

interface SettingsViewProps {
  onBack: () => void
  isFirstTime?: boolean
}

export const SettingsView = ({ onBack, isFirstTime = false }: SettingsViewProps) => {
  const { t, language, setLanguage } = useI18n()
  
  const [apiKey, setApiKey] = useStorage("apiKey", "")
  const [apiUrl, setApiUrl] = useStorage("apiUrl", "http://127.0.0.1:27123")
  const [savePath, setSavePath] = useStorage("savePath", "")
  const [templates, setTemplates] = useStorage<Template[]>("templates", DEFAULT_TEMPLATES)
  const [shortcuts, setShortcuts] = useStorage("shortcuts", DEFAULT_SETTINGS.shortcuts)
  const [strictLineBreaks, setStrictLineBreaks] = useStorage("strictLineBreaks", DEFAULT_SETTINGS.strictLineBreaks)
  const [defaultTemplateId, setDefaultTemplateId] = useStorage("defaultTemplateId", DEFAULT_SETTINGS.defaultTemplateId)
  const [autoSync, setAutoSync] = useStorage("autoSync", DEFAULT_SETTINGS.autoSync)
  
  const [status, setStatus] = useState<"checking" | "connected" | "disconnected">("checking")
  const [showHelp, setShowHelp] = useState(isFirstTime)
  const [folderOptions, setFolderOptions] = useState<string[]>([])
  const [loadingFolders, setLoadingFolders] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleCheckConnection = async () => {
    setStatus("checking")
    if (!apiKey) {
        setStatus("disconnected")
        return
    }
    const isConnected = await checkObsidianStatus(apiKey, apiUrl)
    setStatus(isConnected ? "connected" : "disconnected")
  }

  useEffect(() => {
    handleCheckConnection()
  }, [apiKey, apiUrl])

  const handleAddTemplate = () => {
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: "New Template",
      filenamePattern: "{{title}}",
      contentTemplate: `---
source_url: {{source_url}}
source_title: {{source_title}}
created: {{created}}
---

`
    }
    setTemplates([...templates, newTemplate])
  }

  const handleUpdateTemplate = (id: string, updates: Partial<Template>) => {
    setTemplates(templates.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  const handleDeleteTemplate = (id: string) => {
    if (templates.length <= 1) return
    if (confirmDeleteId === id) {
      setTemplates(templates.filter(t => t.id !== id))
      setConfirmDeleteId(null)
      // Reset default if deleted
      if (defaultTemplateId === id) {
        setDefaultTemplateId(templates.find(t => t.id !== id)?.id || "quick")
      }
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000) // Auto cancel after 3s
    }
  }

  const handleShortcutChange = (key: string, value: string) => {
    const current = shortcuts || DEFAULT_SETTINGS.shortcuts!
    setShortcuts({ ...current, [key]: value })
  }

  const handleReset = () => {
    if (showResetConfirm) {
      setApiKey("")
      setApiUrl("http://127.0.0.1:27123")
      setSavePath("")
      setTemplates(getDefaultTemplates(t))
      setShortcuts(DEFAULT_SETTINGS.shortcuts)
      setStrictLineBreaks(false)
      setDefaultTemplateId("quick")
      setShowResetConfirm(false)
    } else {
      setShowResetConfirm(true)
      setTimeout(() => setShowResetConfirm(false), 3000) // Auto cancel after 3s
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        {!isFirstTime && (
          <button 
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
          >
            <ArrowLeft size={18} />
            <span className="text-sm">{t("back")}</span>
          </button>
        )}
        {isFirstTime && <div />}
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t("settingsTitle")}</h2>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className={clsx("p-1.5 rounded", showHelp ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300")}
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg text-sm">
          <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">{t("gettingStarted")}</h3>
          <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
            <li>{t("installPlugin")}</li>
            <li>{t("enablePlugin")}</li>
            <li>{t("pasteKey")}</li>
            <li>{t("keepOpen")}</li>
          </ol>
          <a 
            href="https://github.com/coddingtonbear/obsidian-local-rest-api"
            target="_blank"
            className="inline-flex items-center gap-1 mt-2 text-blue-600 dark:text-blue-400 hover:underline text-xs"
          >
            <ExternalLink size={12} />
            {t("viewDocs")}
          </a>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-5 px-1">
        {/* Language Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t("languageSection")}</h3>
          <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
             <Globe size={16} className="text-gray-500 dark:text-gray-400" />
             <select 
               value={language} 
               onChange={(e) => setLanguage(e.target.value as any)}
               className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 flex-1 outline-none [&>option]:text-gray-900"
             >
                <option value="auto">{t("languageAuto")}</option>
                <option value="en">English</option>
                <option value="zh_CN">简体中文</option>
                <option value="ja">日本語</option>
             </select>
          </div>
        </section>

        {/* Connection Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t("connectionSection")}</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("apiKeyLabel")}</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder={t("apiKeyPlaceholder")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("apiUrlLabel")}</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setApiUrl("http://127.0.0.1:27123")}
                  className={clsx(
                    "text-xs px-2 py-1 rounded border",
                    apiUrl === "http://127.0.0.1:27123" 
                      ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500 dark:border-violet-600 text-violet-700 dark:text-violet-300" 
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  HTTP
                </button>
                <button
                  onClick={() => setApiUrl("https://127.0.0.1:27124")}
                  className={clsx(
                    "text-xs px-2 py-1 rounded border",
                    apiUrl === "https://127.0.0.1:27124"
                      ? "bg-violet-100 dark:bg-violet-900/30 border-violet-500 dark:border-violet-600 text-violet-700 dark:text-violet-300" 
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                  )}
                >
                  HTTPS
                </button>
              </div>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="w-full p-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={clsx(
                  "w-2 h-2 rounded-full",
                  status === "connected" ? "bg-green-500" : status === "checking" ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {status === "connected" 
                    ? t("statusConnected") 
                    : status === "checking" 
                      ? t("statusChecking") 
                      : t("statusDisconnected")
                  }
                </span>
              </div>
              {status === "disconnected" && (
                <button
                  onClick={openObsidian}
                  className="text-xs px-2 py-1 bg-violet-600 dark:bg-violet-700 text-white rounded hover:bg-violet-700 dark:hover:bg-violet-600"
                >
                  {t("openObsidian")}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Shortcuts Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("shortcutsSection")}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("shortcutGlobalLabel")}
              </label>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500">
                  {t("shortcutGlobalHelp")}
                </p>
                <button
                  onClick={() => chrome.tabs.create({ url: "chrome://extensions/shortcuts" })}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-violet-700 bg-violet-50 border border-violet-200 rounded-lg hover:bg-violet-100 transition-colors"
                >
                  <Keyboard size={16} />
                  {t("configureShortcut")}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("shortcutNewNote")}
              </label>
              <ShortcutInput
                value={shortcuts?.newCard || DEFAULT_SETTINGS.shortcuts?.newCard || "meta+n"}
                onChange={(val) => handleShortcutChange("newCard", val)}
              />
            </div>
            
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("shortcutSave")}
              </label>
              <ShortcutInput
                value={shortcuts?.saveCard || DEFAULT_SETTINGS.shortcuts?.saveCard || "meta+enter"}
                onChange={(val) => handleShortcutChange("saveCard", val)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("shortcutPreview")}
              </label>
              <ShortcutInput
                value={shortcuts?.togglePreview || DEFAULT_SETTINGS.shortcuts?.togglePreview || "meta+e"}
                onChange={(val) => handleShortcutChange("togglePreview", val)}
              />
            </div>
          </div>
        </section>

        {/* Storage Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("storageSection")}</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("savePathLabel")}</label>
              <div className="relative">
                  <input
                    type="text"
                    list="folder-list"
                    value={savePath}
                    onChange={(e) => setSavePath(e.target.value)}
                    onFocus={() => {
                      if (apiKey && apiUrl && status === "connected" && folderOptions.length === 0 && !loadingFolders) {
                        setLoadingFolders(true)
                        getVaultFolders(apiKey, apiUrl).then(folders => {
                          setFolderOptions(folders)
                          setLoadingFolders(false)
                        }).catch(() => setLoadingFolders(false))
                      }
                    }}
                    className="w-full p-2 pr-8 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none"
                    placeholder={t("savePathPlaceholder")}
                  />
                  <datalist id="folder-list">
                    {folderOptions.map(f => <option key={f} value={f} />)}
                  </datalist>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                      {loadingFolders ? (
                        <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : savePath ? (
                        <button
                          onClick={() => setSavePath("")}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          type="button"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      ) : null}
                  </div>
              </div>
               <p className="text-xs text-gray-400 mt-1">
                {t("savePathHelp")}
              </p>
            </div>
          </div>
        </section>

        {/* Editor Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("editorSection")}</h3>
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t("strictLineBreaks")}</label>
              <p className="text-xs text-gray-400">{t("strictLineBreaksHelpFull")}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox"
                checked={strictLineBreaks ?? false}
                onChange={(e) => setStrictLineBreaks(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>
        </section>

        {/* Auto Sync Section */}
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t("autoSyncSection")}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700">{t("autoSyncEnabled")}</label>
                <p className="text-xs text-gray-400">{t("autoSyncHelp")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox"
                  checked={autoSync?.enabled ?? false}
                  onChange={(e) => setAutoSync({ ...autoSync, enabled: e.target.checked, intervalMinutes: autoSync?.intervalMinutes || 5 })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-violet-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600"></div>
              </label>
            </div>
            {autoSync?.enabled && (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                <label className="text-sm text-gray-700 flex-1">{t("autoSyncInterval", [])}</label>
                <select
                  value={autoSync?.intervalMinutes || 5}
                  onChange={(e) => setAutoSync({ ...autoSync, enabled: true, intervalMinutes: parseInt(e.target.value) })}
                  className="px-2 py-1 text-sm border border-gray-200 rounded bg-white"
                >
                  <option value={1}>1 min</option>
                  <option value={5}>5 min</option>
                  <option value={10}>10 min</option>
                  <option value={30}>30 min</option>
                  <option value={60}>60 min</option>
                </select>
              </div>
            )}
          </div>
        </section>

        {/* Templates Section */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t("templatesSection")}</h3>
            <button
              onClick={handleAddTemplate}
              className="text-xs text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <Plus size={14} />
              {t("addTemplate")}
            </button>
          </div>
          
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {defaultTemplateId === template.id && (
                      <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={template.name}
                      onChange={(e) => handleUpdateTemplate(template.id, { name: e.target.value })}
                      className="font-medium text-sm text-gray-900 bg-transparent border-0 p-0 focus:ring-0 outline-none flex-1 min-w-0"
                    />
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {defaultTemplateId !== template.id && (
                      <button
                        onClick={() => setDefaultTemplateId(template.id)}
                        className="text-xs text-gray-400 hover:text-amber-500 px-2"
                        title={t("setAsDefault")}
                      >
                        <Star size={14} />
                      </button>
                    )}
                    {templates.length > 1 && (
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className={clsx(
                          "px-2 py-1 rounded text-xs transition-colors",
                          confirmDeleteId === template.id 
                            ? "bg-red-500 text-white" 
                            : "text-gray-400 hover:text-red-500"
                        )}
                      >
                        {confirmDeleteId === template.id ? t("continue") : <Trash2 size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t("filenamePattern")}</label>
                    <input
                      type="text"
                      value={template.filenamePattern}
                      onChange={(e) => handleUpdateTemplate(template.id, { filenamePattern: e.target.value })}
                      className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-violet-500 outline-none font-mono"
                      placeholder="{{title}}"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">{t("contentTemplate")}</label>
                    <textarea
                      value={template.contentTemplate}
                      onChange={(e) => handleUpdateTemplate(template.id, { contentTemplate: e.target.value })}
                      className="w-full p-2 text-xs border border-gray-200 rounded bg-gray-50 focus:bg-white focus:ring-1 focus:ring-violet-500 outline-none font-mono h-24 resize-y"
                      placeholder="Markdown content..."
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      {t("templateVariables")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* First-time Continue Button */}
      {isFirstTime && apiKey && status === "connected" && (
        <button
          onClick={onBack}
          className="mt-4 w-full py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
        >
          {t("continue")}
        </button>
      )}

      {/* Reset Button */}
      {!isFirstTime && (
        <button
          onClick={handleReset}
          className={clsx(
            "mt-4 w-full py-2 text-sm rounded-lg transition-colors",
            showResetConfirm 
              ? "bg-red-500 text-white hover:bg-red-600" 
              : "text-gray-500 hover:text-red-600 hover:bg-red-50"
          )}
        >
          {showResetConfirm ? t("resetConfirm").split("?")[0] + "?" : t("resetSettings")}
        </button>
      )}
    </div>
  )
}
