import type { Template } from "~types"

export const getDefaultTemplates = (t: (key: string) => string): Template[] => [
    {
        id: "quick",
        name: t("templateQuickNote"),
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
        name: t("templateBookmark"),
        filenamePattern: "{{date}} - {{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: bookmark
---

## [{{source_title}}]({{source_url}})

**${t("whySaved")}**


**Tags:** #bookmark
`
    },
    {
        id: "quote",
        name: t("templateQuote"),
        filenamePattern: "Quote - {{title}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: quote
---

> [!quote] From [{{source_title}}]({{source_url}})
> 

**${t("myThoughts")}**

`
    },
    {
        id: "idea",
        name: t("templateIdea"),
        filenamePattern: "Idea - {{date}}",
        contentTemplate: `---
source_url: "{{source_url}}"
source_title: "{{source_title}}"
created: "{{created}}"
type: idea
---

## 💡 Idea

**${t("trigger")}** [{{source_title}}]({{source_url}})

**${t("theIdea")}**


**${t("nextSteps")}**
- [ ] 

`
    },
    {
        id: "reading",
        name: t("templateReading"),
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

## ${t("keyPoints")}


## ${t("quotes")}


## ${t("mySummary")}


## ${t("actionItems")}
- [ ] 

`
    }
]
