import type { Card, CardFrontmatter } from "~types"

// Check if Obsidian is running and API is accessible
export const checkObsidianStatus = async (
    apiKey: string,
    apiUrl: string
): Promise<boolean> => {
    if (!apiKey || !apiUrl) return false
    try {
        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            }
        })
        const data = await response.json()
        return data.status === "OK" || data.authenticated === true
    } catch (error) {
        console.error("Obsidian check failed:", error)
        return false
    }
}

// Open Obsidian app via protocol
export const openObsidian = () => {
    window.open("obsidian://", "_blank")
}

// Parse frontmatter from markdown content
export const parseFrontmatter = (content: string): { frontmatter: CardFrontmatter | null; body: string } => {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) {
        return { frontmatter: null, body: content }
    }

    const frontmatterStr = match[1]
    const body = match[2]

    // Simple YAML parsing
    const frontmatter: Record<string, string> = {}
    frontmatterStr.split("\n").forEach(line => {
        const colonIndex = line.indexOf(":")
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim()
            const value = line.substring(colonIndex + 1).trim()
            frontmatter[key] = value
        }
    })

    return {
        frontmatter: {
            source_url: frontmatter.source_url || "",
            source_title: frontmatter.source_title || "",
            created: frontmatter.created || "",
            template: frontmatter.template
        },
        body
    }
}

// Search for cards by source URL using Obsidian's search API
export const searchCardsByUrl = async (
    apiKey: string,
    apiUrl: string,
    sourceUrl: string
): Promise<Card[]> => {
    try {
        // Use the search endpoint to find notes with matching source_url
        const response = await fetch(`${apiUrl}/search/simple/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                query: `source_url: "${sourceUrl}"`,
                contextLength: 0
            })
        })

        if (!response.ok) {
            console.error("Search failed:", response.statusText)
            return []
        }

        const results = await response.json()
        const cards: Card[] = []

        // Fetch full content for each result
        for (const result of results) {
            const card = await getCardByPath(apiKey, apiUrl, result.filename)
            if (card && card.sourceUrl === sourceUrl) {
                cards.push(card)
            }
        }

        return cards.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    } catch (error) {
        console.error("Search cards failed:", error)
        return []
    }
}

// Get a single card by its path
export const getCardByPath = async (
    apiKey: string,
    apiUrl: string,
    path: string
): Promise<Card | null> => {
    try {
        const response = await fetch(`${apiUrl}/vault/${encodeURIComponent(path)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "text/markdown"
            }
        })

        if (!response.ok) {
            return null
        }

        const rawContent = await response.text()
        const { frontmatter, body } = parseFrontmatter(rawContent)

        if (!frontmatter) {
            return null
        }

        return {
            path,
            filename: path.split("/").pop() || path,
            sourceUrl: frontmatter.source_url,
            sourceTitle: frontmatter.source_title,
            created: frontmatter.created,
            content: body,
            rawContent
        }
    } catch (error) {
        console.error("Get card failed:", error)
        return null
    }
}

// Create a new card
export const createCard = async (
    apiKey: string,
    apiUrl: string,
    savePath: string,
    filename: string,
    content: string
): Promise<boolean> => {
    const cleanPath = savePath ? savePath.replace(/\/$/, "") : ""
    const fullPath = cleanPath ? `${cleanPath}/${filename}` : filename

    try {
        const response = await fetch(`${apiUrl}/vault/${encodeURIComponent(fullPath)}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "text/markdown"
            },
            body: content
        })

        return response.ok
    } catch (error) {
        console.error("Create card failed:", error)
        return false
    }
}

// Update an existing card
export const updateCard = async (
    apiKey: string,
    apiUrl: string,
    path: string,
    content: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${apiUrl}/vault/${encodeURIComponent(path)}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "text/markdown"
            },
            body: content
        })

        return response.ok
    } catch (error) {
        console.error("Update card failed:", error)
        return false
    }
}

// Delete a card
export const deleteCard = async (
    apiKey: string,
    apiUrl: string,
    path: string
): Promise<boolean> => {
    try {
        const response = await fetch(`${apiUrl}/vault/${encodeURIComponent(path)}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        })

        return response.ok
    } catch (error) {
        console.error("Delete card failed:", error)
        return false
    }
}

// Generate filename from template pattern
export const generateFilename = (
    pattern: string,
    title: string,
    sourceTitle: string
): string => {
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

    // Clean title for filename (remove invalid chars)
    const cleanTitle = (title || sourceTitle || "Untitled")
        .replace(/[\\/:*?"<>|]/g, "-")
        .substring(0, 100)

    return pattern
        .replace(/\{\{title\}\}/g, cleanTitle)
        .replace(/\{\{date\}\}/g, date)
        .replace(/\{\{time\}\}/g, time)
        .replace(/\{\{source_title\}\}/g, sourceTitle.replace(/[\\/:*?"<>|]/g, "-").substring(0, 100))
        + ".md"
}

// Generate content from template
export const generateContent = (
    template: string,
    sourceUrl: string,
    sourceTitle: string
): string => {
    const now = new Date().toISOString()

    return template
        .replace(/\{\{source_url\}\}/g, sourceUrl)
        .replace(/\{\{source_title\}\}/g, sourceTitle)
        .replace(/\{\{created\}\}/g, now)
}
// ... existing code ...

// Get vault folders recursively
export const getVaultFolders = async (apiKey: string, apiUrl: string): Promise<string[]> => {
    const folders = new Set<string>()
    folders.add("/")

    // Queue for BFS: [path_to_scan]
    const queue: string[] = ["/"]
    let count = 0
    const MAX_REQUESTS = 50 // Safety limit to prevent hanging

    try {
        while (queue.length > 0 && count < MAX_REQUESTS) {
            const currentDir = queue.shift()!
            const endpoint = currentDir === "/" ? "/vault/" : `/vault/${currentDir}`

            count++
            const response = await fetch(`${apiUrl}${endpoint}`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "application/json"
                }
            })

            if (!response.ok) continue

            const data = await response.json()
            const files = data.files || []

            files.forEach((f: any) => {
                const name = typeof f === 'string' ? f : f.name
                // In this API, items ending with / are directories
                const isDir = name.endsWith("/")

                if (isDir) {
                    const dirPath = currentDir === "/" ? name : `${currentDir}${name}`
                    // Remove trailing slash for storage in set, but keep for queue if needed?
                    // Let's store standardized paths without trailing slash in the Set
                    // But we need trailing slash for next fetch usually? Not necessarily, API handles it?
                    // The example response has "somedirectory/".

                    const cleanPath = dirPath.slice(0, -1) // remove trailing slash
                    folders.add(cleanPath)

                    // Add to queue to scan children
                    queue.push(dirPath)
                }
            })
        }
    } catch (e) {
        console.error("Failed to fetch folders", e)
    }

    return Array.from(folders).sort()
}
