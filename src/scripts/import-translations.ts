import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import csv from 'csv-parser'
import { kinkList } from '../data/kinks'

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

async function importTranslations(locale: string, csvFile: string) {
  // Read the locale file
  const localeFile = path.join(__dirname, '..', 'locales', `${locale}.json`)
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

// Get arguments from command line
const [locale, csvFile] = process.argv.slice(2)
if (!locale || !csvFile) {
  console.error('Please provide locale code and CSV file path as arguments')
  console.error('Example: npm run import-translations -- en kink-translations-en.csv')
  process.exit(1)
}

importTranslations(locale, csvFile).catch(console.error) 