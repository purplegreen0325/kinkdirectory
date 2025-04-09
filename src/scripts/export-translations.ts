import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { kinkList } from '../data/kinks'
import { createObjectCsvWriter } from 'csv-writer'


interface LocaleData {
  [key: string]: any
}

interface ExportResult {
  locale: string
  count: number
  status: 'success' | 'error'
  error?: string
}

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function exportTranslations(locale: string) {
  // Read the locale file
  const localeFile = path.join(__dirname, '..', 'locales', `${locale}.json`)
  const localeData: LocaleData = JSON.parse(fs.readFileSync(localeFile, 'utf8'))

  const records: any[] = []

  // Go through all kink categories and kinks
  kinkList.forEach(category => {
    category.kinks.forEach(kink => {
      // Navigate the nested structure: localeData.categories[category.id] and localeData[category.id][kink.id]
      const translation = localeData[category.id]?.[kink.id]
      const categoryLabel = localeData.categories?.[category.id] || category.id

      if (translation) {
        records.push({
          category: categoryLabel,
          categoryId: category.id,
          kinkId: kink.id,
          key: `${category.id}.${kink.id}`,
          label: translation.label || '',
          tooltip: translation.tooltip || ''
        })
      }
    })
  })

  // Ensure export directory exists
  const exportDir = path.join(__dirname, '..', 'locales-csv')
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true })
  }

  // Create CSV writer with new path
  const csvWriter = createObjectCsvWriter({
    path: path.join(exportDir, `kink-translations-${locale}.csv`),
    header: [
      { id: 'category', title: 'Category Name' },
      { id: 'categoryId', title: 'Category ID' },
      { id: 'kinkId', title: 'Kink ID' },
      { id: 'key', title: 'Translation Key' },
      { id: 'label', title: 'Label' },
      { id: 'tooltip', title: 'Tooltip' }
    ]
  })

  // Write records to CSV
  await csvWriter.writeRecords(records)
  console.log(`Exported ${records.length} translations for locale ${locale} to ${exportDir}`)
  
  return records.length
}

async function exportAllTranslations() {
  const localesDir = path.join(__dirname, '..', 'locales')
  const files = fs.readdirSync(localesDir)
  const locales = files.filter(file => file.endsWith('.json')).map(file => file.replace('.json', ''))
  
  console.log('Exporting all locales:', locales.join(', '))
  
  const results: ExportResult[] = []
  for (const locale of locales) {
    try {
      const count = await exportTranslations(locale)
      results.push({ locale, count, status: 'success' })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`Error exporting ${locale}:`, errorMessage)
      results.push({ locale, count: 0, status: 'error', error: errorMessage })
    }
  }
  
  // Print summary
  console.log('\nExport Summary:')
  console.log('---------------')
  results.forEach(({ locale, count, status, error }) => {
    if (status === 'success') {
      console.log(`${locale}: ${count} translations exported`)
    } else {
      console.log(`${locale}: Failed - ${error}`)
    }
  })
}

// Get locale from command line argument
const arg = process.argv[2]
if (!arg) {
  console.error('Please provide a locale code as argument (e.g. "en", "fr", etc.)')
  console.error('Or use --all to export all locales')
  process.exit(1)
}

if (arg === '--all') {
  exportAllTranslations().catch(console.error)
} else {
  exportTranslations(arg).catch(console.error)
} 