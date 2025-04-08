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

    // Format as kinkKey,positionNumber,choice
    const selections = Object.entries(list.selections)
      .filter(([_, choice]) => choice !== 0) // Only include non-zero values
      .map(([key, choice]) => {
        // Current format is kinkKey%position
        const [kinkKey, position] = key.split('%')

        // Get position number
        const posNum = POSITION_MAP[position] !== undefined ? POSITION_MAP[position] : 0
        return `${kinkKey},${posNum},${choice}`
      })
      .join(';')

    // Create a minimal data structure
    const compressedData = {
      v: CURRENT_VERSION, // Current version of the data format
      r: ROLE_MAP[list.role],
      s: selections,
    }

    // Base64 encode to make it URL safe
    const encoded = btoa(JSON.stringify(compressedData))

    return `${window.location.origin}${window.location.pathname}?list=${encoded}`
  }

  function decodeListFromUrl(encoded: string): KinkList | null {
    try {
      const decoded = JSON.parse(atob(encoded))

      // Handle both old and new formats
      // Old format had {name, role, selections}
      // New format has {v, r, s} (version, role, selections)

      // Determine role
      let role: UserRole
      if (decoded.r !== undefined) {
        // New format - numeric role
        role = ROLE_NAMES[decoded.r] as UserRole || 'both'
      }
      else if (decoded.role) {
        // Old format - string role
        role = decoded.role as UserRole
      }
      else {
        // Default
        role = 'both'
      }

      // Create list with appropriate role
      const list: KinkList = {
        id: nanoid(8),
        name: decoded.name || 'Shared List',
        role,
        created: Date.now(),
        selections: {},
      }

      // Use the migration function to handle both old and new formats
      list.selections = migrateUrlEncodedList(decoded, kinkMappings)

      return list
    }
    catch (e) {
      console.error('Failed to decode list from URL', e)
      return null
    }
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

  return {
    kinkLists,
    activeListId,
    activeList,
    isViewMode,
    kinkModalState,
    isKinkVisibleForRole,
    getKinkPositions,
    createList,
    deleteList,
    updateList,
    setKinkChoice,
    getKinkChoice,
    encodeListToUrl,
    importListFromUrl,
    viewListFromUrl,
    importViewedList,
    exitViewMode,
    openKinkModal,
    closeKinkModal,
    getVisibleKinksForQuiz,
  }
})
