export const normalizeKey = (e: KeyboardEvent | React.KeyboardEvent): string => {
    const parts = []
    if (e.metaKey) parts.push("meta")
    if (e.ctrlKey) parts.push("ctrl")
    if (e.altKey) parts.push("alt")
    if (e.shiftKey) parts.push("shift")

    // Ignore modifier-only keydowns
    if (["Meta", "Control", "Alt", "Shift"].includes(e.key)) {
        return parts.join("+")
    }

    // Handle keys consistently
    let key = e.key.toLowerCase()
    if (key === " ") key = "space"
    if (key === "escape") key = "esc"
    if (key === "enter") key = "enter"
    // Add other special keys if needed

    parts.push(key)
    return parts.join("+")
}

export const checkShortcut = (e: KeyboardEvent | React.KeyboardEvent, shortcut: string): boolean => {
    if (!shortcut) return false
    return normalizeKey(e) === shortcut.toLowerCase()
}
