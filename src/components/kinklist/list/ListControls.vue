<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMediaQuery } from '@vueuse/core'
import { useKinkListState } from '../../../composables/useKinkList'
import { useScreenshot } from '../../../composables/useScreenshot'
import ConfirmModal from '../../kinklist/modals/ConfirmModal.vue'
import CreateListForm from '../../kinklist/modals/CreateListForm.vue'
import ScreenshotModal from '../../kinklist/modals/ScreenshotModal.vue'
import ShareModal from '../../kinklist/modals/ShareModal.vue'

const { t } = useI18n()
const toast = useToast()
const overlay = useOverlay()

const { 
  activeList, 
  kinkLists, 
  activeListId, 
  encodeListToUrl, 
  deleteList,
  updateList
} = useKinkListState()

const { 
  screenshotLoading, 
  downloadScreenshot,
} = useScreenshot()

// Check if screen is mobile
const isMobile = useMediaQuery('(max-width: 768px)')

// Title editing state
const isEditingTitle = ref(false)
const editedTitle = ref('')

function startEditingTitle() {
  if (!activeList.value) return
  editedTitle.value = activeList.value.name
  isEditingTitle.value = true
}

function saveEditedTitle() {
  if (!activeListId.value || !editedTitle.value.trim()) {
    isEditingTitle.value = false
    return
  }
  
  updateList(activeListId.value, {
    name: editedTitle.value.trim()
  })
  
  isEditingTitle.value = false
  
  toast.add({
    title: t('app.list_updated'),
    description: editedTitle.value,
    color: 'success',
    duration: 3000
  })
}

function cancelEditingTitle() {
  isEditingTitle.value = false
}

// Compute a safe version of activeListId for v-model (string or undefined, not null)
const safeActiveListId = computed({
  get: () => activeListId.value || undefined,
  set: (value: string | undefined) => { activeListId.value = value || null }
})

async function openCreateListModal() {
  try {
    const createFormModal = overlay.create(CreateListForm)
    const id = await createFormModal.open()
    
    if (id) {
      console.log('List created with ID:', id)
    }
  } catch (e) {
    console.log('List creation cancelled')
  }
}

async function handleDeleteList() {
  if (!activeListId.value) return
  
  // Create the confirm modal
  const confirmModal = overlay.create(ConfirmModal, {
    props: {
      title: t('app.delete_confirm_title'),
      message: t('app.delete_confirm_message'),
      confirmColor: 'error'
    }
  })
  
  try {
    // Open the modal and await user response
    const confirmed = await confirmModal.open()
    
    if (confirmed) {
      const deletedName = activeList.value?.name
      deleteList(activeListId.value)
      
      // Show success toast
      toast.add({
        title: t('app.list_deleted'),
        description: deletedName,
        icon: 'i-lucide-trash',
        color: 'success',
        duration: 3000
      })
    }
  } catch (e) {
    console.error('Error in delete confirmation', e)
  }
}

async function openShareModal() {
  if (!activeListId.value) return
  
  const shareUrl = encodeListToUrl(activeListId.value)
  
  // Create the modal instance with props
  const shareModal = overlay.create(ShareModal, {
    props: {
      url: shareUrl
    }
  })
  
  try {
    const copied = await shareModal.open()
    
    if (copied) {
      // Show toast notification for successful copy
      toast.add({
        title: t('app.copy_link'),
        description: t('app.share_list_description'),
        icon: 'i-lucide-link',
        color: 'info',
        duration: 3000
      })
    }
  } catch (e) {
    // Modal was cancelled
    console.log('Share cancelled')
  }
}

async function handleTakeScreenshot() {
  try {
    if (!activeList.value) return
    
    // Create the modal instance with props
    const screenshotModal = overlay.create(ScreenshotModal, {
      props: {
        listName: activeList.value.name || 'export',
        // Pass empty string initially, we'll take the screenshot after modal is opened
        dataUrl: ''
      }
    })
    
    // Open the modal first
    try {
      const result = await screenshotModal.open()
      
      if (result === 'download') {
        downloadScreenshot()
      } else if (result === 'copied') {
        // Show toast notification for successful copy
        toast.add({
          title: t('app.imgur_link'),
          description: t('app.imgur_link_copied'),
          icon: 'i-lucide-link',
          color: 'info',
          duration: 3000
        })
      }
    } catch (e) {
      // Modal was cancelled
      console.log('Screenshot modal cancelled')
    }
  } catch (error) {
    console.error('Failed to take screenshot', error)
  }
}
</script>

<template>
  <div class="bg-white dark:bg-gray-900 rounded-lg shadow p-3 mb-3">
    <!-- Mobile Layout -->
    <template v-if="isMobile">
      <!-- List Selector or Title Editing -->
      <div class="flex items-center gap-2 mb-3">
        <!-- Show input when editing, otherwise show select -->
        <template v-if="isEditingTitle">
          <UInput
            v-model="editedTitle"
            size="sm"
            class="flex-1"
            :placeholder="t('app.list_name')"
            @keyup.enter="saveEditedTitle"
            @keyup.esc="cancelEditingTitle"
            autofocus
          />
          <UButton
            icon="i-lucide-check"
            color="success"
            variant="ghost"
            size="xs"
            square
            @click="saveEditedTitle"
          />
          <UButton
            icon="i-lucide-x"
            color="error"
            variant="ghost"
            size="xs"
            square
            @click="cancelEditingTitle"
          />
        </template>
        <template v-else>
          <USelect
            v-model="safeActiveListId"
            :items="kinkLists.map(list => ({ 
              value: list.id, 
              label: list.name,
              role: list.role,
              created: list.created 
            }))"
            :placeholder="t('app.select_list')"
            class="flex-1"
            size="sm"
          >
            <template #default="{ modelValue }">
              <div v-if="modelValue && activeList" class="flex items-center gap-2">
                <span class="truncate">{{ activeList.name }}</span>
                <UBadge v-if="activeList?.role" size="xs" color="primary">
                  {{ t(`roles.${activeList.role}`) }}
                </UBadge>
              </div>
              <span v-else>{{ t('app.select_list') }}</span>
            </template>
            
            <template #item-label="{ item }">
              <div class="flex flex-col py-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ item.label }}</span>
                  <UBadge size="xs" color="primary">
                    {{ t(`roles.${item.role}`) }}
                  </UBadge>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ new Date(item.created).toLocaleDateString() }}
                </div>
              </div>
            </template>
          </USelect>
          
          <!-- Edit Button -->
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
            square
            @click="startEditingTitle"
            aria-label="Edit list name"
          />
          
          <!-- Delete Button -->
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="xs"
            square
            @click="handleDeleteList"
            aria-label="Delete list"
          />
        </template>
      </div>
      
      <!-- Action Buttons - Horizontal on Mobile -->
      <div class="flex gap-2">
        <!-- Create New List Button -->
        <UButton
          icon="i-lucide-plus"
          color="primary"
          size="sm"
          class="flex-1"
          @click="openCreateListModal"
        >
          {{ t('app.new') }}
        </UButton>
        
        <!-- Share List Button -->
        <UButton
          icon="i-lucide-share"
          color="info"
          size="sm"
          class="flex-1"
          @click="openShareModal"
        >
          {{ t('app.share') }}
        </UButton>
        
        <!-- Screenshot Button -->
        <UButton
          icon="i-lucide-camera"
          color="neutral"
          size="sm"
          class="flex-1"
          :loading="screenshotLoading"
          @click="handleTakeScreenshot"
        >
          {{ t('app.screenshot_short') }}
        </UButton>
      </div>
    </template>
    
    <!-- Desktop Layout - Horizontal -->
    <template v-else>
      <div class="flex items-center">
        <!-- Title Section with Edit functionality -->
        <div class="flex items-center gap-2 mr-auto">
          <div v-if="isEditingTitle" class="flex items-center gap-2">
            <UInput
              v-model="editedTitle"
              size="sm"
              class="min-w-[150px]"
              :placeholder="t('app.list_name')"
              @keyup.enter="saveEditedTitle"
              @keyup.esc="cancelEditingTitle"
              autofocus
            />
            <UButton
              icon="i-lucide-check"
              color="success"
              variant="ghost"
              size="xs"
              square
              @click="saveEditedTitle"
            />
            <UButton
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="xs"
              square
              @click="cancelEditingTitle"
            />
          </div>
          <div v-else-if="activeList" class="flex items-center gap-2 cursor-pointer" @click="startEditingTitle">
            <h2 class="text-lg font-semibold">{{ activeList.name }}</h2>
            <UIcon 
              name="i-lucide-pencil" 
              class="w-4 h-4 text-gray-400"
            />
          </div>
          <UBadge v-if="activeList?.role" size="xs" color="primary">
            {{ t(`roles.${activeList.role}`) }}
          </UBadge>
        </div>
        
        <!-- Right aligned items: List Selector + Action Buttons -->
        <div class="flex items-center gap-2">
          <!-- List Selector -->
          <USelect
            v-model="safeActiveListId"
            :items="kinkLists.map(list => ({ 
              value: list.id, 
              label: list.name,
              role: list.role,
              created: list.created 
            }))"
            :placeholder="t('app.select_list')"
            class="w-56"
            size="sm"
          >
            <template #default="{ modelValue }">
              <div v-if="modelValue && activeList" class="flex items-center gap-2">
                <span class="truncate">{{ activeList.name }}</span>
                <UBadge v-if="activeList?.role" size="xs" color="primary">
                  {{ t(`roles.${activeList.role}`) }}
                </UBadge>
              </div>
              <span v-else>{{ t('app.select_list') }}</span>
            </template>
            
            <template #item-label="{ item }">
              <div class="flex flex-col py-1">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ item.label }}</span>
                  <UBadge size="xs" color="primary">
                    {{ t(`roles.${item.role}`) }}
                  </UBadge>
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ new Date(item.created).toLocaleDateString() }}
                </div>
              </div>
            </template>
          </USelect>
          
          <!-- Action Buttons -->
          <UButton
            icon="i-lucide-plus"
            color="primary"
            size="sm"
            @click="openCreateListModal"
          >
            {{ t('app.create_list') }}
          </UButton>
          
          <UButton
            icon="i-lucide-share"
            color="info"
            size="sm"
            @click="openShareModal"
          >
            {{ t('app.share_list') }}
          </UButton>
          
          <UButton
            icon="i-lucide-camera"
            color="neutral"
            size="sm"
            :loading="screenshotLoading"
            @click="handleTakeScreenshot"
          >
            {{ t('app.screenshot') }}
          </UButton>
          
          <UButton
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="sm"
            square
            @click="handleDeleteList"
            aria-label="Delete list"
          />
        </div>
      </div>
    </template>
  </div>
</template> 