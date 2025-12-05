import { FileText, Plus, Clock, UploadCloud, Trash2, CheckCircle2, ArrowUpCircle } from "lucide-react"
import clsx from "clsx"

import type { LocalCard } from "~types"
import { useI18n } from "~hooks/useI18n"

interface CardListProps {
  cards: LocalCard[]
  isLoading: boolean
  onSelectCard: (card: LocalCard) => void
  onNewCard: () => void
  onUploadCard: (card: LocalCard) => void
  onDeleteCard: (card: LocalCard) => void
  onUploadAll: () => void
  isUploadingMap: Record<string, boolean>
  isUploadingAll: boolean
  shortcutNewCard?: string
  confirmDeleteId?: string | null
}

const getTimeAgo = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const getExcerpt = (content: string, maxLength: number = 80): string => {
  const cleaned = content.trim().replace(/\n+/g, " ")
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength) + "..."
}

export const CardList = ({ 
  cards, 
  isLoading, 
  onSelectCard, 
  onNewCard, 
  onUploadCard,
  onDeleteCard,
  onUploadAll,
  isUploadingMap,
  isUploadingAll,
  shortcutNewCard,
  confirmDeleteId
}: CardListProps) => {
  const { t } = useI18n()

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-gray-400 dark:text-gray-500 text-sm">{t("loadingDrafts")}</div>
      </div>
    )
  }

  const unsyncedCount = cards.filter(c => c.status === "draft").length

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50/50 dark:bg-gray-900">
      {/* Card count & Bulk Actions */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {cards.length === 0 
            ? t("noDrafts")
            : t("draftsCount", String(cards.length))
          }
        </div>
        
        {unsyncedCount > 0 && (
          <button
            onClick={onUploadAll}
            disabled={isUploadingAll}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full transition-all border",
              isUploadingAll 
                ? "bg-violet-100 dark:bg-violet-900/30 border-violet-200 dark:border-violet-800 text-violet-400 dark:text-violet-300 cursor-wait" 
                : "bg-white dark:bg-gray-800 border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:border-violet-300 dark:hover:border-violet-700 shadow-sm"
            )}
            title={t("syncAll")}
          >
            <ArrowUpCircle size={14} />
            {isUploadingAll 
              ? t("syncing") 
              : `${t("syncAll")} (${unsyncedCount})`
            }
          </button>
        )}
      </div>

      {/* Card list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cards.map(card => {
          const isUploading = isUploadingMap[card.id] || (isUploadingAll && card.status === "draft")
          const isSynced = card.status === "synced"
          
          return (
            <div
              key={card.id}
              className="group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-sm transition-all overflow-hidden"
            >
              {/* Card Content (Clickable) */}
              <button
                onClick={() => onSelectCard(card)}
                className="w-full text-left p-3 pb-2"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                    {card.title || "Untitled Card"}
                  </div>
                  {isSynced ? (
                    <span className="text-green-500 dark:text-green-400" title={t("synced")}>
                      <CheckCircle2 size={14} />
                    </span>
                  ) : (
                    <span className={clsx(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded transition-colors",
                      isUploading 
                        ? "text-violet-500 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30" 
                        : "text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30"
                    )}>
                      {isUploading ? t("syncing") : t("draft")}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 min-h-[1.5em] font-normal leading-relaxed text-opacity-80 dark:text-opacity-80">
                  {getExcerpt(card.content) || <span className="italic text-gray-300 dark:text-gray-600">Empty draft</span>}
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                  <Clock size={10} />
                  <span>{getTimeAgo(card.updated)}</span>
                </div>
              </button>

              {/* Actions Footer */}
              <div className="flex border-t border-gray-50 dark:border-gray-700/50 divide-x divide-gray-50 dark:divide-gray-700/50 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50/50 dark:bg-gray-900/40">
                <button
                  onClick={(e) => { e.stopPropagation(); onUploadCard(card) }}
                  disabled={isUploading || isSynced}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
                    isSynced 
                      ? "text-gray-300 dark:text-gray-600 cursor-default" 
                      : isUploading 
                        ? "text-violet-400 dark:text-violet-500 cursor-wait" 
                        : "text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                  )}
                  title={isSynced ? t("synced") : t("sync")}
                >
                  <UploadCloud size={14} />
                  {isUploading ? "..." : isSynced ? t("synced") : t("sync")}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteCard(card) }}
                  className={clsx(
                    "flex-none px-2 flex items-center justify-center transition-colors",
                    confirmDeleteId === card.id 
                      ? "bg-red-500 text-white" 
                      : "text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  )}
                  title={t("deleteConfirm")}
                >
                  {confirmDeleteId === card.id ? (
                    <span className="text-xs">{t("confirmDelete")}</span>
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          )
        })}
        
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-600">
            <FileText size={48} className="mb-3 opacity-20" />
            <p className="text-sm">{t("noDrafts") || "No drafts for this page"}</p>
          </div>
        )}
      </div>

      {/* New card button */}
      <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
        <button
          onClick={onNewCard}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 dark:bg-violet-700 text-white rounded-lg hover:bg-violet-700 dark:hover:bg-violet-600 transition-colors font-medium shadow-sm hover:shadow"
        >
          <Plus size={18} />
          <span className="text-sm">{t("shortcutNewNote")} ({shortcutNewCard?.replace("meta", "⌘").replace("ctrl", "Ctrl").split("+").map(k => k.toUpperCase()).join("+") || "Ctrl+N"})</span>
        </button>
      </div>
    </div>
  )
}
