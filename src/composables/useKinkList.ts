import type { KinkChoice, KinkDefinition, KinkList, UserRole } from '../types'
import { createGlobalState, useStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'
import { kinkList } from '../data/kinks'
import {
  createKinkMappings,
  CURRENT_VERSION,
  migrateStoredLists,
  migrateUrlEncodedList,
  POSITION_MAP,
  POSITION_NAMES,
} from './useKinkListMigration'

// Role numeric mapping (single source of truth)
const ROLE_MAP: Record<string, number> = {
  both: 0,
  dom: 1,
  sub: 2,
}

// Role names in order (for decoding)
const ROLE_NAMES = ['both', 'dom', 'sub']

export const useKinkListState = createGlobalState(() => {
  // Create kink mappings for old to new format
  const kinkMappings = createKinkMappings()

  // User kink lists storage
  const kinkLists = useStorage<KinkList[]>('kinklist-lists', [])

  // Filter settings storage
  const filters = useStorage<{
    showOnlyNew: boolean
    showOnlyUnfilled: boolean
    choiceFilters: KinkChoice[]
  }>('kinklist-filters-1.0.1', {
    showOnlyNew: false,
    showOnlyUnfilled: false,
    choiceFilters: [],
  })

  // Run migrations if needed
  migrateStoredLists(kinkLists.value)

  const activeListId = ref<string | null>(null)
  const viewOnlyList = ref<KinkList | null>(null)
  const isViewMode = computed(() => viewOnlyList.value !== null)

  // Add modal state for kink details
  const kinkModalState = ref({
    isOpen: false,
    title: '',
    description: '',
  })

  const activeList = computed(() => {
    if (isViewMode.value)
      return viewOnlyList.value
    if (!activeListId.value)
      return null
    return kinkLists.value.find(list => list.id === activeListId.value) || null
  })

  const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60) // 2 days in seconds
  const recentlyAddedKinks = computed(() => {
    let count = 0
    kinkList.forEach((category) => {
      category.kinks.forEach((kink) => {
        if (kink.addedAt && kink.addedAt > twoDaysAgo) {
          count++
        }
      })
    })
    return count
  })

  // Count of new unfilled positions (not just kinks)
  const newUnfilledPositionsCount = computed(() => {
    const allAvailableKinks = getVisibleKinksForQuiz()

    // Count all unfilled positions in new kinks
    let totalUnfilled = 0

    allAvailableKinks.forEach((item) => {
      // Only count positions for new kinks
      if (item.kink.addedAt && item.kink.addedAt > twoDaysAgo) {
        // Count each unfilled position
        item.positions.forEach((position) => {
          const value = getKinkChoice(item.kink, position)
          if (value === 0) {
            totalUnfilled++
          }
        })
      }
    })

    return totalUnfilled
  })

  const newKinksAvailable = computed(() => newUnfilledPositionsCount.value > 0)

  // Function to determine if a kink should be visible based on user role
  function isKinkVisibleForRole(kink: KinkDefinition, userRole: UserRole): boolean {
    // General format kinks are always visible
    if (kink.format === 'general') {
      return true
    }

    // For role-specific kinks, check if any of the allowed perspectives apply to the current role
    if (kink.format === 'role_specific' && kink.allowedPerspectives) {
      if (userRole === 'both') {
        // In 'both' mode, only show kinks where perspective is 'self'
        return kink.allowedPerspectives.some(
          rp => (rp.role === 'dom' || rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'self',
        )
      }
      else {
        // Otherwise check if this specific role is allowed
        return kink.allowedPerspectives.some(
          rp => rp.role === userRole || rp.role === 'both',
        )
      }
    }

    return false
  }

  // Get the positions to display for a kink based on format and user role
  function getKinkPositions(kink: KinkDefinition, userRole: UserRole): string[] {
    if (kink.format === 'general') {
      return ['general'] // General kinks just have one position
    }

    if (kink.format === 'role_specific' && kink.allowedPerspectives) {
      const positions: string[] = []

      if (userRole === 'both') {
        // For 'both' mode, include dom/partner and sub/self perspectives
        const hasDomPartner = kink.allowedPerspectives.some(
          rp => rp.role === 'dom' && rp.perspective === 'partner',
        )

        const hasSubSelf = kink.allowedPerspectives.some(
          rp => rp.role === 'sub' && rp.perspective === 'self',
        )

        if (hasDomPartner)
          positions.push('for_sub')
        if (hasSubSelf)
          positions.push('as_sub')
      }
      else if (userRole === 'dom') {
        // For dom users, check self and partner perspectives
        const selfAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'self',
        )

        const partnerAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'partner',
        )

        if (selfAllowed)
          positions.push('as_dom')
        if (partnerAllowed)
          positions.push('for_sub')
      }
      else if (userRole === 'sub') {
        // For sub users, check self and partner perspectives
        const selfAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'self',
        )

        const partnerAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'partner',
        )

        if (selfAllowed)
          positions.push('as_sub')
        if (partnerAllowed)
          positions.push('for_dom')
      }

      // Note: Added for debugging purposes
      if (positions.length === 0) {
        console.warn(`No positions found for kink ${kink.id} (key: ${kink.key}) with role ${userRole}`, kink.allowedPerspectives)
      }

      return positions
    }

    return []
  }

  function createList(name: string, role: UserRole): string {
    const id = nanoid(8)
    kinkLists.value.push({
      id,
      name,
      role,
      created: Date.now(),
      selections: {},
    })
    activeListId.value = id
    return id
  }

  function deleteList(id: string) {
    const index = kinkLists.value.findIndex(list => list.id === id)
    if (index !== -1) {
      kinkLists.value.splice(index, 1)
      if (activeListId.value === id) {
        activeListId.value = kinkLists.value.length > 0 ? kinkLists.value[0].id : null
      }
    }
  }

  function setKinkChoice(
    kinkDef: KinkDefinition,
    position: string,
    choice: KinkChoice,
  ) {
    if (!activeList.value)
      return

    // Store using key%position format
    const key = `${kinkDef.key}%${position}`
    activeList.value.selections[key] = choice
  }

  function getKinkChoice(
    kinkDef: KinkDefinition,
    position: string,
  ): KinkChoice {
    if (!activeList.value)
      return 0

    // Access using key%position format
    const key = `${kinkDef.key}%${position}`
    return activeList.value.selections[key] || 0
  }

  function encodeListToUrl(listId?: string): string {
    const list = listId
      ? kinkLists.value.find(l => l.id === listId)
      : activeList.value

    if (!list)
      return ''

    // Only include non-zero values
    const nonZeroSelections = Object.entries(list.selections)
      .filter(([_, choice]) => choice !== 0)

    // For new format (v1+), use a compact binary encoding
    // Each kink selection requires 2 bytes:
    // - 10 bits for kink key (0-1023)
    // - 3 bits for position (0-7)
    // - 3 bits for choice (0-7)

    // Create a binary buffer for the data
    // Format:
    // - 1 byte for version (v1)
    // - 1 byte for role (0-2)
    // - 2 bytes for selection count
    // - N*2 bytes for selections (2 bytes per selection)
    const selectionCount = nonZeroSelections.length
    const bufferSize = 4 + (selectionCount * 2) // 4 bytes header + 2 bytes per selection
    const buffer = new Uint8Array(bufferSize)

    // Write header
    buffer[0] = CURRENT_VERSION // Version
    buffer[1] = ROLE_MAP[list.role] // Role
    buffer[2] = (selectionCount >> 8) & 0xFF // Selection count high byte
    buffer[3] = selectionCount & 0xFF // Selection count low byte

    // Write selections
    let offset = 4
    nonZeroSelections.forEach(([key, choice]) => {
      // Parse the key format kinkKey%position
      const [kinkKeyStr, position] = key.split('%')
      const kinkKey = Number.parseInt(kinkKeyStr)
      const posNum = POSITION_MAP[position] || 0

      // Pack into 2 bytes:
      // - First 10 bits: kink key (0-1023)
      // - Next 3 bits: position (0-7)
      // - Last 3 bits: choice (0-7)
      const value = (kinkKey << 6) | (posNum << 3) | choice

      // Write as 2 bytes (big-endian)
      buffer[offset++] = (value >> 8) & 0xFF // High byte
      buffer[offset++] = value & 0xFF // Low byte
    })

    // Convert to a URL-safe string
    // First convert to base64
    const binaryString = Array.from(buffer).map(b => String.fromCharCode(b)).join('')
    const base64 = btoa(binaryString)

    // Make URL-safe by replacing + with - and / with _
    const urlSafe = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

    return `${window.location.origin}${window.location.pathname}?list=${urlSafe}`
  }

  function decodeListFromUrl(encoded: string): KinkList | null {
    try {
      // First check if this is a binary format (v1+) or JSON format (legacy)
      // Better detection: try to decode first byte to check version
      let isBinary = false
      try {
        // Convert from URL-safe base64 back to binary to check first byte
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')

        // Add padding if needed
        let padded = base64
        const padding = 4 - (base64.length % 4)
        if (padding < 4) {
          padded += '='.repeat(padding)
        }

        // Decode just the first character to check version
        const firstByte = atob(padded).charCodeAt(0)
        isBinary = firstByte === CURRENT_VERSION
      }
      catch {
        // If we can't decode it as binary, it's definitely not binary
        isBinary = false
      }

      if (isBinary) {
        console.log('Detected binary format')
        // Convert from URL-safe base64 back to binary
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')

        // Add padding if needed
        let padded = base64
        const padding = 4 - (base64.length % 4)
        if (padding < 4) {
          padded += '='.repeat(padding)
        }

        // Decode base64 to binary
        const binaryString = atob(padded)
        const buffer = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          buffer[i] = binaryString.charCodeAt(i)
        }

        // Read header
        const roleNum = buffer[1]
        const selectionCount = (buffer[2] << 8) | buffer[3]

        // Create list object
        const list: KinkList = {
          id: nanoid(8),
          name: 'Shared List',
          role: ROLE_NAMES[roleNum] as UserRole || 'both',
          created: Date.now(),
          selections: {},
        }

        // Read selections
        let offset = 4
        for (let i = 0; i < selectionCount; i++) {
          const highByte = buffer[offset++]
          const lowByte = buffer[offset++]
          const value = (highByte << 8) | lowByte

          // Unpack:
          // - First 10 bits: kink key (0-1023)
          // - Next 3 bits: position (0-7)
          // - Last 3 bits: choice (0-7)
          const kinkKey = (value >> 6) & 0x3FF
          const posNum = (value >> 3) & 0x7
          const choice = value & 0x7

          // Convert position number to name
          const position = POSITION_NAMES[posNum] || 'general'

          // Store in selections
          const key = `${kinkKey}%${position}`
          list.selections[key] = choice as KinkChoice
        }

        return list
      }
      else {
        console.log('Detected JSON format')
        // Legacy JSON format
        let decoded
        try {
          decoded = JSON.parse(atob(encoded))
          console.log('Decoded JSON:', decoded)
        }
        catch (e) {
          console.error('Failed to parse JSON from URL', e)
          return null
        }

        // Detect format type
        const formatType = detectListFormat(decoded)

        // Determine role based on format type
        let role: UserRole = 'both'
        let name = 'Shared List'

        if (formatType === 'new') {
          // New format - numeric role
          role = ROLE_NAMES[decoded.r] as UserRole || 'both'
          // Use the name if provided in newer format
          name = decoded.n || 'Shared List'
        }
        else if (formatType === 'old') {
          // Old format - string role
          role = decoded.role as UserRole || 'both'
          name = decoded.name || 'Shared List'
        }

        // Create list with appropriate properties
        const list: KinkList = {
          id: nanoid(8),
          name,
          role,
          created: Date.now(),
          selections: {},
        }

        // Process selections based on format type
        if (formatType === 'new') {
          // For new format, simply convert the data
          decoded.s.split(';').forEach((item: string) => {
            try {
              const [kinkKey, posNum, choiceStr] = item.split(',')
              const choice = Number(choiceStr) as KinkChoice

              // Get position name from position number
              const positionNumber = Number(posNum)
              const position = POSITION_NAMES[positionNumber] || 'general'

              // Store as kinkKey%position
              const key = `${kinkKey}%${position}`
              list.selections[key] = choice
            }
            catch (err) {
              console.error('Error parsing item:', item, err)
            }
          })
        }
        else {
          // For old formats, use the migration function
          list.selections = migrateUrlEncodedList(decoded, kinkMappings)
        }

        return list
      }
    }
    catch (e) {
      console.error('Failed to decode list from URL', e)
      return null
    }
  }

  // Helper function to detect the format of list data
  function detectListFormat(data: any): 'new' | 'old' {
    // New format has v (version) and s (selections as comma-separated string)
    if (data.v === CURRENT_VERSION && data.s && !data.s.includes('=')) {
      return 'new'
    }

    // Any other format is considered old and needs migration
    return 'old'
  }

  function viewListFromUrl(encoded: string): KinkList | null {
    const list = decodeListFromUrl(encoded)
    if (!list)
      return null

    viewOnlyList.value = list
    return list
  }

  function importListFromUrl(encoded: string): string | null {
    const list = decodeListFromUrl(encoded)
    if (!list)
      return null

    kinkLists.value.push(list)
    activeListId.value = list.id
    return list.id
  }

  function importViewedList(): string | null {
    if (!viewOnlyList.value)
      return null

    // Add the currently viewed list to saved lists
    kinkLists.value.push(viewOnlyList.value)
    activeListId.value = viewOnlyList.value.id

    // Clear view mode
    viewOnlyList.value = null

    return activeListId.value
  }

  function exitViewMode(): void {
    viewOnlyList.value = null
    // Clear the URL parameter when exiting view mode
    if (window.history && window.location.search.includes('list=')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  function openKinkModal(title: string, description: string) {
    kinkModalState.value = {
      isOpen: true,
      title,
      description,
    }
  }

  function closeKinkModal() {
    kinkModalState.value.isOpen = false
  }

  function updateList(listId: string, updates: Partial<KinkList>) {
    const listIndex = kinkLists.value.findIndex(list => list.id === listId)
    if (listIndex !== -1) {
      kinkLists.value[listIndex] = {
        ...kinkLists.value[listIndex],
        ...updates,
      }
    }
  }

  // Get all visible kinks for quiz mode in a flat structure
  function getVisibleKinksForQuiz(): Array<{ categoryId: string, kink: KinkDefinition, positions: string[] }> {
    if (!activeList.value)
      return []

    const allKinks: Array<{ categoryId: string, kink: KinkDefinition, positions: string[] }> = []

    // Get categories with type assertion to ensure TypeScript knows the structure

    // Loop through all categories and kinks to find visible ones
    for (const category of kinkList) {
      for (const kink of category.kinks) {
        if (isKinkVisibleForRole(kink, activeList.value.role)) {
          const positions = getKinkPositions(kink, activeList.value.role)
          if (positions.length > 0) {
            allKinks.push({
              categoryId: category.id,
              kink,
              positions,
            })
          }
        }
      }
    }

    return allKinks
  }

  // Check if a kink should be shown based on applied filters
  function shouldShowKink(kink: KinkDefinition): boolean {
    // No active filters means show everything
    if (!filters.value.showOnlyNew && !filters.value.showOnlyUnfilled && filters.value.choiceFilters.length === 0) {
      return true
    }

    let shouldShow = true

    // Apply "only new" filter if enabled
    if (filters.value.showOnlyNew) {
      shouldShow = shouldShow && (!!kink.addedAt && kink.addedAt > twoDaysAgo)
    }

    // Apply "only unfilled" filter if enabled
    if (filters.value.showOnlyUnfilled && activeList.value) {
      // Get the positions for this kink
      const positions = getKinkPositions(kink, activeList.value.role)

      // Check if any positions are unfilled (rating = 0)
      const hasUnfilledPositions = positions.some(position =>
        getKinkChoice(kink, position) === 0,
      )

      shouldShow = shouldShow && hasUnfilledPositions
    }

    // Apply choice filters if any are selected
    if (filters.value.choiceFilters.length > 0 && activeList.value) {
      const positions = getKinkPositions(kink, activeList.value.role)

      // Check if any position has a choice that matches the filters
      const hasMatchingChoice = positions.some((position) => {
        const choice = getKinkChoice(kink, position)
        return filters.value.choiceFilters.includes(choice)
      })

      shouldShow = shouldShow && hasMatchingChoice
    }

    return shouldShow
  }

  // Check if any filters are active
  const hasActiveFilters = computed(() =>
    filters.value.showOnlyNew
    || filters.value.showOnlyUnfilled
    || filters.value.choiceFilters.length > 0,
  )

  // Count active filters
  const activeFilterCount = computed(() => {
    let count = 0
    if (filters.value.showOnlyNew)
      count++
    if (filters.value.showOnlyUnfilled)
      count++
    if (filters.value.choiceFilters.length > 0)
      count++
    return count
  })

  // Clear all choice filters
  function clearChoiceFilters() {
    filters.value.choiceFilters = []
  }

  // Clear all filters
  function clearAllFilters() {
    filters.value.showOnlyNew = false
    filters.value.showOnlyUnfilled = false
    filters.value.choiceFilters = []
  }

  return {
    kinkLists,
    activeListId,
    activeList,
    isViewMode,
    kinkModalState,
    filters,
    isKinkVisibleForRole,
    getKinkPositions,
    createList,
    deleteList,
    recentlyAddedKinks,
    updateList,
    setKinkChoice,
    getKinkChoice,
    encodeListToUrl,
    importListFromUrl,
    viewListFromUrl,
    importViewedList,
    exitViewMode,
    openKinkModal,
    newUnfilledPositionsCount,
    newKinksAvailable,
    closeKinkModal,
    getVisibleKinksForQuiz,
    shouldShowKink,
    hasActiveFilters,
    activeFilterCount,
    clearChoiceFilters,
    clearAllFilters,
  }
})
