<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import CreateListForm from '../modals/CreateListForm.vue'

const { t } = useI18n()
const { kinkLists, activeListId, recentlyAddedKinks: recentlyAddedKinksCount } = useKinkListState()
const overlay = useOverlay()

function handleListSelection(id: string) {
  activeListId.value = id
}

async function openCreateListModal() {
  const createFormModal = overlay.create(CreateListForm)
  await createFormModal.open()
}

// Get role-based styling for list cards
function getRoleColor(role: 'sub' | 'dom' | 'both') {
  switch (role) {
    case 'dom': return 'before:bg-red-400'
    case 'sub': return 'before:bg-violet-400'
    case 'both': return 'before:bg-blue-400'
    default: return 'before:bg-gray-400'
  }
}

// Color mapping for badge colors
function getBadgeColor(role: 'sub' | 'dom' | 'both') {
  switch (role) {
    case 'dom': return 'error'
    case 'sub': return 'primary'
    case 'both': return 'info'
    default: return 'neutral'
  }
}

// Format date in a more user-friendly way
function formatDate(dateString: string | number) {
  try {
    const date = new Date(dateString)
    // Check if date is valid
    if (Number.isNaN(date.getTime())) {
      return t('app.recent')
    }

    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return t('app.today')
    }
    else if (diffDays === 1) {
      return t('app.yesterday')
    }
    else {
      // Just use the locale date string for any other date
      return date.toLocaleDateString()
    }
  }
  catch {
    // Fallback in case of error
    return t('app.recent')
  }
}
</script>

<template>
  <div>
    <!-- Empty state (no lists) -->
    <div v-if="kinkLists.length === 0" class="py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="grid md:grid-cols-2 gap-8 items-center">
          <!-- Left content: Text and button -->
          <div class="space-y-6">
            <div class="space-y-4">
              <div class="flex items-center gap-2">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ t('app.welcome_title') }}
                </h2>
                <!-- New kinks badge - improved styling -->
                <span v-if="recentlyAddedKinksCount > 0" class="inline-flex items-center rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-2 py-0.5">
                  <UIcon name="i-lucide-star" class="mr-1 text-[0.65rem]" />
                  {{ recentlyAddedKinksCount }} {{ t('app.new') }}
                </span>
              </div>
              <p class="text-gray-600 dark:text-gray-300">
                {{ t('app.welcome_description') }}
              </p>

              <div class="space-y-3 mt-2">
                <div class="flex items-start">
                  <UIcon name="i-lucide-shield-check" class="flex-shrink-0 w-5 h-5 mt-1 text-primary-500" />
                  <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                    {{ t('app.welcome_privacy') }}
                  </p>
                </div>
                <div class="flex items-start">
                  <UIcon name="i-lucide-share" class="flex-shrink-0 w-5 h-5 mt-1 text-primary-500" />
                  <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                    {{ t('app.welcome_sharing') }}
                  </p>
                </div>
                <div class="flex items-start">
                  <UIcon name="i-lucide-palette" class="flex-shrink-0 w-5 h-5 mt-1 text-primary-500" />
                  <p class="ml-3 text-sm text-gray-600 dark:text-gray-300">
                    {{ t('app.welcome_customization') }}
                  </p>
                </div>
              </div>
            </div>

            <UButton
              size="lg"
              color="primary"
              icon="i-lucide-plus"
              class="font-medium"
              @click="openCreateListModal"
            >
              {{ t('app.create_list') }}
            </UButton>
          </div>

          <!-- Right content: Images with desktop and mobile views -->
          <div class="relative">
            <!-- Main desktop image container with improved sizing -->
            <div class="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
              <!-- Desktop image with contain instead of cover -->
              <img
                src="/desktop.png"
                alt="Desktop application preview"
                class="w-full object-contain"
                style="max-height: 400px;"
              >
            </div>

            <!-- Mobile image with improved positioning -->
            <div class="absolute -bottom-6 right-2 rounded-xl overflow-hidden shadow-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
              <!-- Mobile image with contain instead of cover -->
              <img
                src="/mobile.png"
                alt="Mobile application preview"
                class="block"
                style="height: 220px; width: auto;"
              >
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lists exist state with enhanced styling -->
    <div v-else class="py-8 px-4 max-w-3xl mx-auto">
      <!-- Header - simplified clean styling -->
      <div class="mb-8 text-center">
        <div class="inline-flex items-center gap-2 justify-center">
          <h2 class="text-xl font-bold text-primary-500">
            {{ t('app.your_lists') }}
          </h2>

          <!-- New kinks badge - improved styling -->
          <span v-if="recentlyAddedKinksCount > 0" class="inline-flex items-center rounded-full text-xs font-medium bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 px-2 py-0.5">
            <UIcon name="i-lucide-star" class="mr-1 text-[0.65rem]" />
            {{ recentlyAddedKinksCount }} {{ t('app.new') }}
          </span>
        </div>
      </div>

      <!-- List Grid - Using fixed widths and flex to prevent stretching -->
      <div class="flex flex-wrap justify-center gap-4">
        <div
          v-for="list in kinkLists"
          :key="list.id"
          class="relative cursor-pointer group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 ease-in-out border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1.5 w-[220px]"
          :class="getRoleColor(list.role)"
          @click="handleListSelection(list.id)"
        >
          <!-- Card Content -->
          <div class="p-4">
            <!-- List Name and Role Badge -->
            <div class="flex items-start justify-between mb-2">
              <h3 class="text-base font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate mr-2">
                {{ list.name }}
              </h3>
              <UBadge
                :color="getBadgeColor(list.role)"
                variant="soft"
                size="sm"
                class="ml-2 font-medium flex-shrink-0"
              >
                {{ t(`roles.${list.role}`) }}
              </UBadge>
            </div>

            <!-- Stats -->
            <div class="flex items-center text-xs mb-2">
              <UIcon name="i-lucide-list-checks" class="mr-1.5 text-gray-500 flex-shrink-0" />
              <span class="text-gray-500 dark:text-gray-400">
                {{ Object.keys(list.selections).filter(key => list.selections[key] !== 0).length }} {{ t('app.selections') }}
              </span>
            </div>

            <!-- Date -->
            <div class="flex items-center justify-between">
              <div class="flex items-center text-xs text-gray-500 dark:text-gray-400">
                <UIcon name="i-lucide-clock" class="mr-1.5 flex-shrink-0" />
                <span>{{ formatDate(list.created) }}</span>
              </div>

              <!-- Arrow icon -->
              <div class="flex items-center justify-center w-6 h-6 rounded-full group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors flex-shrink-0">
                <UIcon name="i-lucide-chevron-right" class="text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </div>
          </div>
        </div>

        <!-- Add new list card -->
        <div
          class="cursor-pointer bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-gray-100 dark:hover:bg-gray-800 flex flex-col items-center justify-center py-6 px-4 transition-all duration-200 ease-in-out w-[220px]"
          @click="openCreateListModal"
        >
          <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
            <UIcon name="i-lucide-plus" class="text-gray-500 dark:text-gray-400 text-xl" />
          </div>
          <h3 class="text-base font-medium text-gray-900 dark:text-white mb-1">
            {{ t('app.create_new_list') }}
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
            {{ t('app.create_list_prompt') }}
          </p>
        </div>
      </div>

      <!-- Motivational text with emoji -->
      <div class="mt-8 text-center">
        <p class="text-sm text-gray-600 dark:text-gray-300">
          ✨ {{ t('app.motivational_text') }} ✨
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Optional: Add subtle animations */
.group {
  transform: translateY(0);
}
.group:hover {
  transform: translateY(-2px);
}
</style>
