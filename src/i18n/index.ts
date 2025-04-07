import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import nl from '../locales/nl.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'
import de from '../locales/de.json'
import it from '../locales/it.json'
import pt from '../locales/pt.json'
import ru from '../locales/ru.json'
import zh from '../locales/zh.json'
import ja from '../locales/ja.json'
import ko from '../locales/ko.json'
import ar from '../locales/ar.json'
import hi from '../locales/hi.json'

export type MessageSchema = typeof en

// Define our supported locales
const SUPPORTED_LOCALES = ['en', 'nl', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi'] as const
type SupportedLocale = typeof SUPPORTED_LOCALES[number]

// Create a map of all locale messages for type safety
const messages: Record<SupportedLocale, MessageSchema | Partial<MessageSchema>> = {
  en,
  nl,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  zh, 
  ja,
  ko,
  ar,
  hi
}

// Create i18n instance
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  missingWarn: false  // Disable warnings for missing translations
})

export default i18n 