// Core types for the card system

export interface Template {
    id: string
    name: string
    filenamePattern: string  // e.g. "{{title}}" or "{{date}}-{{title}}"
    contentTemplate: string  // Markdown with placeholders like {{source_url}}, {{source_title}}
}

export interface Settings {
    apiKey: string
    apiUrl: string
    savePath: string
    filenameFormat: string
    templates: Template[]
    defaultTemplateId: string  // Default template for new notes
    shortcuts: {
        newCard: string     // Side Panel
        saveCard: string    // Editor
        togglePreview: string // Editor
    }
    strictLineBreaks: boolean  // Markdown strict line breaks (preview only)
    autoSync: {
        enabled: boolean
        intervalMinutes: number  // 0 = disabled, 1-60 minutes
    }
}

export interface LocalCard {
    id: string
    title: string
    content: string
    templateId: string
    sourceUrl: string
    sourceTitle: string
    status: "draft" | "synced"
    created: string
    updated: string
    obsidianPath?: string // If synced
}

// Deprecated: Only used for reference or if we re-enable sync later
export interface Card {
    path: string
    filename: string
    sourceUrl: string
    sourceTitle: string
    created: string
    content: string
    rawContent: string
}

export interface CardFrontmatter {
    source_url: string
    source_title: string
    created: string
    template?: string
}

// Default templates for web browsing note capture
export const DEFAULT_TEMPLATES: Template[] = [
    {
        id: "quick",
        name: "Quick Note",
        filenamePattern: "{{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: note
---

`
    },
    {
        id: "bookmark",
        name: "Bookmark",
        filenamePattern: "{{date}} - {{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: bookmark
---

## [{{source_title}}]({{source_url}})

**Why saved:**


**Tags:** #bookmark
`
    },
    {
        id: "quote",
        name: "Quote",
        filenamePattern: "Quote - {{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: quote
---

> [!quote] From [{{source_title}}]({{source_url}})
> 

**My thoughts:**

`
    },
    {
        id: "idea",
        name: "Idea",
        filenamePattern: "Idea - {{date}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: idea
---

## Idea

**Trigger:** [{{source_title}}]({{source_url}})

**The idea:**


**Next steps:**
- [ ] 

`
    },
    {
        id: "reading",
        name: "Reading Note",
        filenamePattern: "Reading - {{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: reading
status: in-progress
---

# {{source_title}}

**Source:** [Link]({{source_url}})

## Key Points


## Quotes


## My Summary


## Action Items
- [ ] 

`
    }
]

export const DEFAULT_SETTINGS: Partial<Settings> = {
    apiUrl: "http://127.0.0.1:27123",
    savePath: "",
    filenameFormat: "{{title}}",
    templates: DEFAULT_TEMPLATES,
    defaultTemplateId: "quick",
    shortcuts: {
        newCard: "ctrl+n",
        saveCard: "ctrl+enter",
        togglePreview: "ctrl+e"
    },
    strictLineBreaks: false,
    autoSync: {
        enabled: false,
        intervalMinutes: 5
    }
}
