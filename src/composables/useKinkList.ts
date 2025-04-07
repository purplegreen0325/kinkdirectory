import { createGlobalState, useStorage } from '@vueuse/core'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'
import type { KinkChoice, KinkList, KinkCategory, KinkDefinition, UserRole } from '../types'
import kinkData from '../data/kinks.json'

export const useKinkListState = createGlobalState(() => {
  const kinkLists = useStorage<KinkList[]>('kinklist-lists', [])
  const activeListId = ref<string | null>(null)
  const viewOnlyList = ref<KinkList | null>(null)
  const isViewMode = computed(() => viewOnlyList.value !== null)
  
  // Add modal state for kink details
  const kinkModalState = ref({
    isOpen: false,
    title: '',
    description: ''
  })
  
  const activeList = computed(() => {
    if (isViewMode.value) return viewOnlyList.value
    if (!activeListId.value) return null
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
          rp => (rp.role === 'dom' || rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'self'
        )
      } else {
        // Otherwise check if this specific role is allowed
        return kink.allowedPerspectives.some(
          rp => rp.role === userRole || rp.role === 'both'
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
          rp => rp.role === 'dom' && rp.perspective === 'partner'
        )
        
        const hasSubSelf = kink.allowedPerspectives.some(
          rp => rp.role === 'sub' && rp.perspective === 'self'
        )
        
        if (hasDomPartner) positions.push('for_sub')
        if (hasSubSelf) positions.push('as_sub')
      } 
      else if (userRole === 'dom') {
        // For dom users, check self and partner perspectives
        const selfAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'self'
        )
        
        const partnerAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'partner'
        )
        
        if (selfAllowed) positions.push('as_dom')
        if (partnerAllowed) positions.push('for_sub')
      } 
      else if (userRole === 'sub') {
        // For sub users, check self and partner perspectives
        const selfAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'self'
        )
        
        const partnerAllowed = kink.allowedPerspectives.some(
          rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'partner'
        )
        
        if (selfAllowed) positions.push('as_sub')
        if (partnerAllowed) positions.push('for_dom')
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
      selections: {}
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
    categoryId: string, 
    kinkId: string, 
    position: string, 
    choice: KinkChoice
  ) {
    if (!activeList.value) return
    
    const key = `${categoryId}_${kinkId}_${position}`
    activeList.value.selections[key] = choice
  }

  function getKinkChoice(
    categoryId: string, 
    kinkId: string, 
    position: string
  ): KinkChoice {
    if (!activeList.value) return 0
    
    const key = `${categoryId}_${kinkId}_${position}`
    return activeList.value.selections[key] || 0
  }

  function encodeListToUrl(listId?: string): string {
    const list = listId 
      ? kinkLists.value.find(l => l.id === listId) 
      : activeList.value
    
    if (!list) return ''
    
    // Create a compressed representation of the selections
    const selections = Object.entries(list.selections)
      .filter(([_, value]) => value !== 0) // Only include non-zero values
      .map(([key, value]) => `${key}=${value}`)
      .join(',')
    
    // Base64 encode to make it URL safe
    const encoded = btoa(JSON.stringify({
      name: list.name,
      role: list.role,
      selections
    }))
    
    // Normalize the pathname to ensure it doesn't end with a slash before query parameters
    const pathname = window.location.pathname.endsWith('/') 
      ? window.location.pathname.slice(0, -1) 
      : window.location.pathname
    
    return `${window.location.origin}${pathname}?list=${encoded}`
  }

  function decodeListFromUrl(encoded: string): KinkList | null {
    try {
      const decoded = JSON.parse(atob(encoded))
      
      const list: KinkList = {
        id: nanoid(8),
        name: decoded.name || 'Imported List',
        role: decoded.role || 'both',
        created: Date.now(),
        selections: {}
      }
      
      // Parse the selections
      if (decoded.selections) {
        decoded.selections.split(',').forEach((item: string) => {
          const [key, value] = item.split('=')
          list.selections[key] = parseInt(value) as KinkChoice
        })
      }
      
      return list
    } catch (e) {
      console.error('Failed to decode list from URL', e)
      return null
    }
  }

  function viewListFromUrl(encoded: string): KinkList | null {
    const list = decodeListFromUrl(encoded)
    if (!list) return null
    
    viewOnlyList.value = list
    return list
  }

  function importListFromUrl(encoded: string): string | null {
    const list = decodeListFromUrl(encoded)
    if (!list) return null
    
    kinkLists.value.push(list)
    activeListId.value = list.id
    return list.id
  }

  function importViewedList(): string | null {
    if (!viewOnlyList.value) return null
    
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
      description
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
        ...updates
      }
    }
  }

  // Get all visible kinks for quiz mode in a flat structure
  function getVisibleKinksForQuiz(): Array<{categoryId: string, kink: KinkDefinition, positions: string[]}> {
    if (!activeList.value) return []
    
    const allKinks: Array<{categoryId: string, kink: KinkDefinition, positions: string[]}> = []
    
    // Get categories with type assertion to ensure TypeScript knows the structure
    const categories = (kinkData.categories as KinkCategory[])
    
    // Loop through all categories and kinks to find visible ones
    for (const category of categories) {
      for (const kink of category.kinks) {
        if (isKinkVisibleForRole(kink, activeList.value.role)) {
          const positions = getKinkPositions(kink, activeList.value.role)
          if (positions.length > 0) {
            allKinks.push({
              categoryId: category.id,
              kink,
              positions
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
    getVisibleKinksForQuiz
  }
}) 