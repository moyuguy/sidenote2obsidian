import en from "../../assets/_locales/en/messages.json"
import zh_CN from "../../assets/_locales/zh_CN/messages.json"
import ja from "../../assets/_locales/ja/messages.json"

export const messages = {
    en,
    "zh_CN": zh_CN,
    "zh-CN": zh_CN, // handle standard navigator.language format
    ja
}

export type Language = "auto" | "en" | "zh_CN" | "ja"
