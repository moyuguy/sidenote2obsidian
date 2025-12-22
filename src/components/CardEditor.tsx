import { useState, useEffect, useMemo, useRef } from "react"
import { useStorage } from "@plasmohq/storage/hook"
import { marked } from "marked"
import { ArrowLeft, Save, X, Eye, Edit3 } from "lucide-react"
import clsx from "clsx"

import type { LocalCard, Template } from "~types"
import { generateFilename, generateContent } from "~utils/obsidian"
import { DEFAULT_TEMPLATES, DEFAULT_SETTINGS } from "~types"
import { checkShortcut } from "~utils/keyboard"
import { useI18n } from "~hooks/useI18n"

interface CardEditorProps {
  card: LocalCard | null  // null = new card
  sourceUrl: string
  sourceTitle: string
  onSave: () => void
  onCancel: () => void
}

export const CardEditor = ({ card, sourceUrl, sourceTitle, onSave, onCancel }: CardEditorProps) => {
  const { t } = useI18n()
  const [localCards, setLocalCards] = useStorage<LocalCard[]>("localCards", [])
  const [templates] = useStorage<Template[]>("templates", DEFAULT_TEMPLATES)
  const [strictLineBreaks] = useStorage("strictLineBreaks", DEFAULT_SETTINGS.strictLineBreaks)
  const [defaultTemplateId] = useStorage("defaultTemplateId", DEFAULT_SETTINGS.defaultTemplateId)
  
  // Move ID generation to state initialization so we have it for templates
  const [tempId] = useState(() => crypto.randomUUID())
  const cardId = card?.id || tempId
  
  const isNewCard = !card
  
  // Helper to generate full content from template with variable substitution
  const getFullContentFromTemplate = (templateId: string, templateList: Template[]): string => {
    const tmpl = templateList.find(t => t.id === templateId) || templateList[0]
    if (!tmpl) return ""
    const now = new Date().toISOString()
    const date = now.split("T")[0]
    let newContent = tmpl.contentTemplate
      // Use the stable cardId we generated
      .replace(/\{\{uuid\}\}/g, cardId)
      .replace(/\{\{source_url\}\}/g, sourceUrl)
      .replace(/\{\{source_title\}\}/g, sourceTitle)
      .replace(/\{\{created\}\}/g, now)
      .replace(/\{\{date\}\}/g, date)
      
    // Fallback: If template didn't have {{uuid}} and replacement didn't happen,
    // we should try to inject it into the frontmatter.
    if (!newContent.includes(cardId) && newContent.startsWith("---")) {
        // Simple injection after the first ---
        newContent = newContent.replace(/^---\n/, `---\nuuid: "${cardId}"\n`)
    }
    
    return newContent
  }
  
  const [content, setContent] = useState(card?.content || "")
  const [title, setTitle] = useState(card?.title || "")
  const [selectedTemplateId, setSelectedTemplateId] = useState(card?.templateId || defaultTemplateId || "quick")
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(!!card)
  const [cursorPosition, setCursorPosition] = useState<{ start: number; end: number } | null>(null)
  
  const [hasUserSelectedTemplate, setHasUserSelectedTemplate] = useState(false)
  
  // Refs for focus management
  const titleInputRef = useRef<HTMLInputElement>(null)
  const contentInputRef = useRef<HTMLTextAreaElement>(null)

  // Toggle preview and save/restore cursor position
  const handleTogglePreview = () => {
    if (!showPreview && contentInputRef.current) {
      // Save cursor position before switching to preview
      setCursorPosition({
        start: contentInputRef.current.selectionStart,
        end: contentInputRef.current.selectionEnd
      })
    }
    setShowPreview(!showPreview)
  }

  // Restore cursor position when returning to edit mode
  useEffect(() => {
    if (!showPreview && cursorPosition && contentInputRef.current) {
      contentInputRef.current.focus()
      contentInputRef.current.setSelectionRange(cursorPosition.start, cursorPosition.end)
    }
  }, [showPreview])

  // Parse markdown to HTML, hiding YAML frontmatter
  const htmlContent = useMemo(() => {
    try {
      // Strip YAML frontmatter from preview
      const contentWithoutFrontmatter = content.replace(/^---[\s\S]*?---\n?/, "")
      return marked.parse(contentWithoutFrontmatter || "*No content*", { breaks: !strictLineBreaks }) as string
    } catch {
      return content
    }
  }, [content, strictLineBreaks])

  // Initialize content when templates are loaded (for new cards)
  useEffect(() => {
    if (isNewCard && !hasInitialized && templates.length > 0) {
      const newContent = getFullContentFromTemplate(selectedTemplateId, templates)
      setContent(newContent)
      setHasInitialized(true)
    }
  }, [templates, isNewCard, hasInitialized, selectedTemplateId])

  // Initial focus
  // Initial focus
  useEffect(() => {
    const focusTitle = () => {
        if (titleInputRef.current) {
            titleInputRef.current.focus()
        }
    }

    // Attempt immediately
    if (isNewCard) focusTitle()

    // Attempt after delay
    const timeoutId = setTimeout(() => {
        if (isNewCard) {
          focusTitle()
        } else {
          contentInputRef.current?.focus()
        }
    }, 100) // Reduced delay, but double attempt
    
    // Also listen for window focus (common for popup opening)
    const handleWindowFocus = () => {
        if (isNewCard) setTimeout(focusTitle, 50)
    }
    window.addEventListener("focus", handleWindowFocus)

    return () => {
        clearTimeout(timeoutId)
        window.removeEventListener("focus", handleWindowFocus)
    }
  }, [isNewCard])

  // Update content when template changes for new cards (after initialization)
  useEffect(() => {
    if (isNewCard && hasInitialized) {
      const newContent = getFullContentFromTemplate(selectedTemplateId, templates)
      setContent(newContent)
    }
  }, [selectedTemplateId])

  // Sync selected template with default when it loads (fix for default not being selected)
  useEffect(() => {
    if (isNewCard && defaultTemplateId && !hasUserSelectedTemplate) {
        // If the user hasn't manually picked a template yet, we should respect the default
        // whenever it loads or changes.
        setSelectedTemplateId(defaultTemplateId)
    }
  }, [defaultTemplateId, isNewCard, hasUserSelectedTemplate])

  const handleSave = async () => {
    if (!content.trim() && isNewCard) return
    
    setIsSaving(true)
    try {
      const now = new Date().toISOString()
      
        if (isNewCard) {
        const newCard: LocalCard = {
          id: cardId, // Use the same ID that was put in the content
          title,
          content,
          templateId: selectedTemplateId,
          sourceUrl,
          sourceTitle,
          status: "draft",
          created: now,
          updated: now
        }
        await setLocalCards([newCard, ...localCards])
      } else {
        const updatedCards = localCards.map(c => 
          c.id === card.id 
            ? { ...c, title, content, updated: now, templateId: selectedTemplateId, status: "draft" as const } 
            : c
        )
        await setLocalCards(updatedCards)
      }
      
      // Add a small delay to ensure storage write completion
      await new Promise(resolve => setTimeout(resolve, 100))
      
      onSave?.()
    } finally {
      setIsSaving(false)
    }
  }

  const [shortcuts] = useStorage("shortcuts", DEFAULT_SETTINGS.shortcuts)

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentShortcuts = shortcuts || DEFAULT_SETTINGS.shortcuts
      
      // ESC to exit
      if (e.key === "Escape") {
        e.preventDefault()
        onCancel()
        return
      }
      
      // Toggle Preview
      if (checkShortcut(e, currentShortcuts?.togglePreview || "ctrl+e")) {
        e.preventDefault()
        if (!showPreview && contentInputRef.current) {
          setCursorPosition({
            start: contentInputRef.current.selectionStart,
            end: contentInputRef.current.selectionEnd
          })
        }
        setShowPreview(prev => !prev)
      }
      
      // Save
      if (checkShortcut(e, currentShortcuts?.saveCard || "ctrl+enter")) {
        e.preventDefault()
        handleSave()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [content, title, selectedTemplateId, isNewCard, localCards, shortcuts, showPreview])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button 
          onClick={onCancel}
          className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">{t("back")}</span>
        </button>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePreview}
            className={clsx(
              "p-2 rounded transition-colors",
              showPreview 
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400" 
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title={`${t("shortcutPreview")} (Ctrl+E)`}
          >
            {showPreview ? <Edit3 size={18} /> : <Eye size={18} />}
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 dark:bg-violet-700 text-white rounded-lg hover:bg-violet-700 dark:hover:bg-violet-600 disabled:bg-gray-400 dark:disabled:bg-gray-700 text-sm font-medium shadow-sm transition-all"
            title={`${t("shortcutSave")} (Ctrl+Enter)`}
          >
            <Save size={16} />
            {isSaving ? t("uploading") : t("saveDraft")}
          </button>
        </div>
      </div>

      {/* Template & Title (for editing/new) */}
      {!showPreview && (
        <div className="px-4 pt-4 pb-2 space-y-3 border-b border-gray-100 dark:border-gray-800">
           {/* Template Selector */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {templates.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setHasUserSelectedTemplate(true)
                  setSelectedTemplateId(t.id)
                }}
                className={clsx(
                  "px-3 py-1 text-xs rounded-full border whitespace-nowrap transition-colors",
                  selectedTemplateId === t.id 
                    ? "bg-violet-100 dark:bg-violet-900/40 border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-medium" 
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
          
          <input
            ref={titleInputRef}
            type="text"
            autoFocus={true}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder={t("editorTitlePlaceholder")}
            className="w-full text-base font-medium placeholder:text-gray-400 dark:placeholder:text-gray-600 border-0 p-0 focus:ring-0 outline-none bg-transparent text-gray-900 dark:text-white"
            onKeyDown={(e) => {
              if (e.key === "Tab" && !e.shiftKey) {
                e.preventDefault()
                contentInputRef.current?.focus()
              }
            }}
          />
        </div>
      )}

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden relative">
        {showPreview ? (
          <div 
            className="h-full overflow-y-auto px-4 py-6 prose prose-sm dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-violet-600 dark:prose-a:text-violet-400"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <textarea
            ref={contentInputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t("editorContentPlaceholder")}
            className="w-full h-full p-4 resize-none border-0 focus:ring-0 outline-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200 bg-transparent placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        )}
      </div>
    </div>
  )
}
