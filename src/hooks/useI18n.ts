import { useStorage } from "@plasmohq/storage/hook"
import { useCallback } from "react"
import { messages, type Language } from "~locales"

export const useI18n = () => {
    const [language, setLanguage] = useStorage<Language>("language", "auto")

    const t = useCallback((key: string, substitutions?: string | string[]) => {
        // If auto, attempt to use chrome.i18n. 
        // However, chrome.i18n uses the BROWSER language.
        // If we want to support manual override, we must use our manual lookup when language != auto.
        // Even for 'auto', if we want consistency (e.g. if browser is fr but we don't have fr, chrome.i18n falls back to default_locale).

        if (language === "auto") {
            return chrome.i18n.getMessage(key, substitutions as any)
        }

        // Manual lookup
        // Fallback to en if language not found
        const langMessages = (messages as any)[language] || messages.en
        const item = langMessages[key]

        let msg = item ? item.message : ""

        // Fallback to chrome.i18n if missing in manual file (optional, but good safety)
        if (!msg) {
            return chrome.i18n.getMessage(key, substitutions as any)
        }

        // Handle substitutions
        if (substitutions) {
            if (Array.isArray(substitutions)) {
                substitutions.forEach((sub, i) => {
                    // Replace $1, $2 etc.
                    msg = msg.replace(`$${i + 1}`, sub)

                    // Also handle $PLACEHOLDER$ style if we can parse it? 
                    // Existing code uses $COUNT$ or $MINUTES$ in the message, mapped via placeholders in json.
                    // Since we are doing manual replacement on the raw message string which contains $PLACEHOLDERS$,
                    // we might need to be smarter.
                    // BUT, looking at messages.json: "message": "$COUNT$ drafts"
                    // So we should replace $1? No.
                    // If the message has $COUNT$, chrome.i18n expects 'placeholders' config to map $1 to COUNT.
                    // If we read the raw message, it has $COUNT$.
                    // So we should replace the *placeholder names* if they exist in the item?

                    if (item.placeholders) {
                        // Iterate placeholders
                        Object.keys(item.placeholders).forEach(pKey => {
                            const pVal = item.placeholders[pKey].content // e.g. "$1"
                            if (pVal === `$${i + 1}`) {
                                // This placeholder maps to this substitution
                                // regex replace ignoring case
                                const displayKey = pKey.toUpperCase() // usually keys are case agnostic in usage?
                                // The message has $COUNT$. keys is "count".
                                msg = msg.replace(new RegExp(`\\$${displayKey}\\$`, 'gi'), sub)
                            }
                        })
                    }
                })
            } else {
                // Single string
                if (item.placeholders) {
                    Object.keys(item.placeholders).forEach(pKey => {
                        const pVal = item.placeholders[pKey].content
                        if (pVal === `$1`) {
                            msg = msg.replace(new RegExp(`\\$${pKey}\\$`, 'gi'), substitutions)
                        }
                    })
                } else {
                    // classic %s or $1?
                    msg = msg.replace(/\$1/, substitutions)
                }
            }
        }

        return msg
    }, [language])

    return { t, language, setLanguage }
}
