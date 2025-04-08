<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useSettings } from '../../../composables/useSettings'

const emit = defineEmits<{
  (e: 'close'): void
}>()
const { t } = useI18n()
const { settings } = useSettings()

function handleCancel() {
  emit('close')
}
</script>

<template>
  <UModal
    :title="t('app.settings')"
    @close="handleCancel"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Introduction - without a card -->
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
          {{ t('app.settings_intro', 'Customize your KinkList experience by adjusting these settings.') }}
        </p>

        <!-- Display Settings Category -->
        <div>
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('app.display_settings', 'Display Settings') }}
          </h3>

          <!-- Kink Order Option in a single card -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <!-- Main Setting -->
            <div class="p-3 bg-gray-50 dark:bg-gray-800">
              <USwitch
                v-model="settings.reverseKinkOrder"
                :label="t('app.reverse_kink_order', 'Reverse Rating Order')"
                :description="t('app.reverse_kink_order_desc_short', 'Changes display order of ratings')"
                color="primary"
              />
            </div>

            <!-- Visual Example - directly below in same card but different background -->
            <div class="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {{ t('app.current_order', 'Current Order:') }}
              </p>
              <div class="flex items-center space-x-2 p-1">
                <!-- Not entered (0) circle -->
                <div class="flex-shrink-0 w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />

                <template v-if="settings.reverseKinkOrder">
                  <!-- 1,2,3,4,5 -->
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-green-500 dark:border-green-400 bg-green-500 dark:bg-green-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-yellow-500 dark:border-yellow-400 bg-yellow-500 dark:bg-yellow-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-orange-500 dark:border-orange-400 bg-orange-500 dark:bg-orange-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400" />
                </template>
                <template v-else>
                  <!-- 5,4,3,2,1 -->
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-orange-500 dark:border-orange-400 bg-orange-500 dark:bg-orange-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-yellow-500 dark:border-yellow-400 bg-yellow-500 dark:bg-yellow-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-green-500 dark:border-green-400 bg-green-500 dark:bg-green-400" />
                  <div class="flex-shrink-0 w-4 h-4 rounded-full border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Action Buttons -->
    <template #footer>
      <UButton
        color="primary"
        @click="handleCancel"
      >
        {{ t('app.done') }}
      </UButton>
    </template>
  </UModal>
</template>
