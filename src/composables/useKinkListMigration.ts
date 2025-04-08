import type { KinkChoice, KinkList } from '../types'
import { useStorage } from '@vueuse/core'
import { kinkList } from '../data/kinks'

// Current version of the data format
export const CURRENT_VERSION = 1

// Position numeric mapping (single source of truth)
export const POSITION_MAP: Record<string, number> = {
  general: 0,
  as_dom: 1,
  as_sub: 2,
  for_dom: 3,
  for_sub: 4,
}

// Position names in order (for decoding)
export const POSITION_NAMES = [
  'general',
  'as_dom',
  'as_sub',
  'for_dom',
  'for_sub',
]

// Create a mapping of old kink identification (categoryId_kinkId) to new kink keys
export function createKinkMappings(): Record<string, number> {
  const mappings: Record<string, number> = {}

  // Build the mapping from all kinks in the kinkList
  kinkList.forEach((category) => {
    category.kinks.forEach((kink) => {
      const oldFormat = `${category.id}_${kink.id}`
      mappings[oldFormat] = kink.key
    })
  })

  return mappings
}

// Migrate stored lists in localStorage
export function migrateStoredLists(kinkLists: KinkList[]): boolean {
  // Track if changes were made
  let migrated = false

  // Migration version tracking
  const storageVersion = useStorage<number>('kinklist-version', 0)

  // Only migrate if version is outdated and there are lists to migrate
  if (storageVersion.value < CURRENT_VERSION && kinkLists.length > 0) {
    console.log(`Migrating kink lists from version ${storageVersion.value} to ${CURRENT_VERSION}`)

    // Get mappings for old to new format
    const kinkMappings = createKinkMappings()

    // Migrate from version 0 to 1 (old format to new format)
    if (storageVersion.value < 1) {
      kinkLists.forEach((list) => {
        const newSelections: Record<string, KinkChoice> = {}

        // Convert each selection from old format to new format
        Object.entries(list.selections).forEach(([key, choice]) => {
          // Define all possible positions to recognize at the end of the key
          const allPositions = ['general', 'as_dom', 'as_sub', 'for_dom', 'for_sub']

          // Find which position this key ends with
          let position = ''
          let categoryAndKinkId = key

          for (const pos of allPositions) {
            if (key.endsWith(`_${pos}`)) {
              position = pos
              // Remove the position part from the end
              categoryAndKinkId = key.slice(0, key.length - pos.length - 1) // -1 for the underscore
              break
            }
          }

          if (!position) {
            console.warn(`Could not extract position from key: ${key}`)
            return
          }

          // Look up the numeric key for this kink
          const numericKey = kinkMappings[categoryAndKinkId]

          if (numericKey !== undefined && position) {
            // Create new format key: kinkKey%position
            const newKey = `${numericKey}%${position}`
            newSelections[newKey] = choice
          }
          else {
            console.warn(`Could not find mapping for: ${categoryAndKinkId}`)
          }
        })

        // Replace old selections with migrated ones
        list.selections = newSelections
      })

      migrated = true
    }

    // Update version number after migration
    storageVersion.value = CURRENT_VERSION
  }

  return migrated
}

// Migrate a list from URL when importing
export function migrateUrlEncodedList(decoded: any, kinkMappings: Record<string, number>): Record<string, KinkChoice> {
  const selections: Record<string, KinkChoice> = {}

  // Handle both old and new format URL data
  let selectionData = ''
  let isOldFormat = false

  // Check if we have the new format with .s property
  if (decoded.s) {
    console.log('[Migrate] New style format detected with .s property')
    selectionData = decoded.s

    // Check if this is potentially using the old value format (key=value)
    const samplePart = selectionData.split(';')[0] || ''
    isOldFormat = samplePart.includes('=') || decoded.v === 0 || !decoded.v
  }
  // Check if we have the very old format with .selections property as a string
  else if (decoded.selections && typeof decoded.selections === 'string') {
    console.log('[Migrate] Very old format detected with .selections as string')
    selectionData = decoded.selections
    isOldFormat = true
  }
  // No valid format found
  else {
    console.log('[Migrate] No valid list format found in URL')
    return selections
  }

  if (isOldFormat) {
    console.log('[Migrate] Old value format detected (key=value)')
    // Old format conversion logic
    // Format could be either:
    // 1. category_kink_position=choice;category_kink_position=choice...
    // 2. category_kink_position=choice,category_kink_position=choice...

    // Split by either semicolon or comma, depending on format
    const separator = selectionData.includes(';') ? ';' : ','
    const oldSelections = selectionData.split(separator)

    oldSelections.forEach((item: string) => {
      try {
        const [key, choiceStr] = item.split('=')
        if (!key || !choiceStr) {
          console.warn(`Invalid item format: ${item}`)
          return
        }

        const choice = Number(choiceStr) as KinkChoice

        // Define all possible positions to recognize at the end of the key
        const allPositions = ['general', 'as_dom', 'as_sub', 'for_dom', 'for_sub']

        // Find which position this key ends with
        let position = ''
        let categoryAndKinkId = key

        for (const pos of allPositions) {
          if (key.endsWith(`_${pos}`)) {
            position = pos
            // Remove the position part from the end
            categoryAndKinkId = key.slice(0, key.length - pos.length - 1) // -1 for the underscore
            break
          }
        }

        if (!position) {
          console.warn(`Could not extract position from key in URL: ${key}`)
          return
        }

        // Look up the numeric key
        const numericKey = kinkMappings[categoryAndKinkId]

        if (numericKey !== undefined) {
          // Create new format key
          const newKey = `${numericKey}%${position}`
          selections[newKey] = choice
        }
        else {
          console.warn(`Could not find mapping for URL item: ${categoryAndKinkId}`)
        }
      }
      catch (err) {
        console.error('Error parsing old format item:', item, err)
      }
    })
  }
  else {
    console.log('[Migrate] New value format detected (key,pos,choice)')
    // Current format - kinkKey,posNum,choice
    selectionData.split(';').forEach((item: string) => {
      try {
        const [kinkKey, posNum, choiceStr] = item.split(',')
        const choice = Number(choiceStr) as KinkChoice

        // Get position name from position number
        const positionNumber = Number(posNum)
        const position = POSITION_NAMES[positionNumber] || 'general'

        // Store as kinkKey%position
        const key = `${kinkKey}%${position}`
        selections[key] = choice
      }
      catch (err) {
        console.error('Error parsing item:', item, err)
      }
    })
  }

  return selections
}
