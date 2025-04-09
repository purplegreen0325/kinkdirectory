import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'
import { kinkList } from '../data/kinks'

interface Translation {
  label: string
  tooltip?: string
}

interface LocaleData {
  [key: string]: any
}

interface CsvRecord {
  category: string
  categoryId: string
  kinkId: string
  key: string
  label: string
  tooltip: string
}

// Create a set of valid kink keys for validation
const validKinkKeys = new Set<string>()
kinkList.forEach(category => {
  category.kinks.forEach(kink => {
    validKinkKeys.add(`${category.id}.${kink.id}`)
  })
})

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function importTranslations(locale: string) {
  // Setup paths
  const localeFile = path.join(__dirname, '..', 'locales', `${locale}.json`)
  const csvDir = path.join(__dirname, '..', 'locales-csv')
  const csvFile = path.join(csvDir, `kink-translations-${locale}.csv`)

  // Check if CSV file exists
  if (!fs.existsSync(csvFile)) {
    console.error(`CSV file not found: ${csvFile}`)
    console.error('Make sure you have exported the translations first using the export script.')
    process.exit(1)
  }

  // Read the locale file
  const localeData: LocaleData = JSON.parse(fs.readFileSync(localeFile, 'utf8'))

  const records: CsvRecord[] = []
  const skippedRecords: string[] = []
  const updatedRecords: string[] = []

  // Read CSV file
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (data: CsvRecord) => records.push(data))
      .on('end', resolve)
      .on('error', reject)
  })

  // Update translations
  records.forEach(record => {
    // Only process if it's a valid kink key and has content
    if (validKinkKeys.has(record.key) && (record.label || record.tooltip)) {
      // Ensure category exists
      if (!localeData[record.categoryId]) {
        localeData[record.categoryId] = {}
      }

      // Update the translation
      localeData[record.categoryId][record.kinkId] = {
        label: record.label,
        ...(record.tooltip && { tooltip: record.tooltip })
      }

      // Update category name if it exists
      if (record.category && record.category !== record.categoryId) {
        if (!localeData.categories) {
          localeData.categories = {}
        }
        localeData.categories[record.categoryId] = record.category
      }

      updatedRecords.push(record.key)
    } else if (!validKinkKeys.has(record.key)) {
      skippedRecords.push(record.key)
    }
  })

  // Create backup of original file
  const backupFile = `${localeFile}.backup`
  fs.copyFileSync(localeFile, backupFile)

  // Write back to locale file
  fs.writeFileSync(localeFile, JSON.stringify(localeData, null, 2))
  
  console.log(`Updated ${updatedRecords.length} translations for locale ${locale}`)
  console.log(`Backup created at: ${backupFile}`)
  
  if (skippedRecords.length > 0) {
    console.log(`\nSkipped ${skippedRecords.length} invalid kink keys:`)
    skippedRecords.forEach(key => console.log(`  - ${key}`))
  }
}

// Get locale from command line argument
const locale = process.argv[2]
if (!locale) {
  console.error('Please provide a locale code as argument')
  console.error('Example: npm run import-translations -- en')
  console.error('\nThis will import from src/locales-csv/kink-translations-en.csv')
  process.exit(1)
}

importTranslations(locale).catch(console.error) 