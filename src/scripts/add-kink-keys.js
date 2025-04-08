// Use ES modules instead of CommonJS
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Get the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the kinks.ts file
const kinksFilePath = path.join(__dirname, '../data/kinks.ts')

// Read the kinks.ts file
const kinksFile = fs.readFileSync(kinksFilePath, 'utf8')

// Parse the kinks array from the file content
const kinkListMatch = kinksFile.match(/export const kinkList:KinkCategory\[\] = ([\s\S]+);?\s*$/)
if (!kinkListMatch) {
  console.error('Could not find kinkList in the file')
  process.exit(1)
}

// Parse the kink list as JSON by converting TS to valid JSON
const kinksArrayStr = kinkListMatch[1]
  .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
  .replace(/\/\/.*$/gm, '') // Remove comments

// Convert the string to actual JavaScript
const kinkArray = eval(`(${kinksArrayStr})`)

// Find the highest existing key to avoid ID collisions
let highestKey = -1
kinkArray.forEach((category) => {
  category.kinks.forEach((kink) => {
    if (kink.key !== undefined && kink.key > highestKey) {
      highestKey = kink.key
    }
  })
})

// Start from the next available key
let nextKey = highestKey + 1

// Count of newly added keys
let addedKeys = 0

// Add keys only to kinks that don't already have one
kinkArray.forEach((category) => {
  category.kinks.forEach((kink) => {
    if (kink.key === undefined) {
      kink.key = nextKey++
      addedKeys++
    }
  })
})

// Convert back to string with proper formatting
const updatedKinksArrayStr = JSON.stringify(kinkArray, null, 2)
  .replace(/"(\w+)":/g, '$1:') // Convert "property": to property:
  .replace(/\[/g, '[\n  ')
  .replace(/\]/g, '\n]')
  .replace(/\},/g, '},\n  ')
  .replace(/\}\],/g, '}\n  ],')
  .replace(/\},\n {2}\n\]/g, '}\n  ]')

// Create the updated file content
const updatedContent = `import type { KinkCategory } from "src/types";

export const kinkList:KinkCategory[] = ${updatedKinksArrayStr};
`

// Write the updated content back to the file
fs.writeFileSync(kinksFilePath, updatedContent)

console.log(`Successfully added keys to ${addedKeys} kinks.`)
console.log(`Highest key used: ${nextKey - 1}`)
