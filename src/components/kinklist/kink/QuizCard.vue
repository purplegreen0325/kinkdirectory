<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import QuizModal from '../../kinklist/modals/QuizModal.vue'

defineProps<{
  compact: boolean
}>()

const { t } = useI18n()
const overlay = useOverlay()
const { activeListId } = useKinkListState()

// Open quiz modal function
async function openQuizModal() {
  if (!activeListId.value)
    return

  // Create the modal instance
  const quizModal = overlay.create(QuizModal, {
    props: {
      listId: activeListId.value,
    },
  })
  await quizModal.open()
}

defineExpose({
  openQuizModal,
})
</script>

<template>
  <!-- Full card for when there are no selections -->
  <div v-if="!compact" class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 mb-3 transition-all duration-200">
    <div class="flex flex-col items-center justify-center text-center px-2 py-1">
      <UIcon name="i-lucide-list-checks" class="text-success-500 text-xl mb-1" />
      <div class="text-sm font-medium mb-1">
        {{ t('app.quiz_mode') }}
      </div>
      <div class="text-xs text-gray-600 dark:text-gray-400 mb-2">
        {{ t('app.quick_rate_all_kinks') }}
      </div>
      <UButton
        icon="i-lucide-play"
        color="success"
        size="sm"
        class="whitespace-nowrap"
        @click="openQuizModal"
      >
        {{ t('app.start_quiz') }}
      </UButton>
    </div>
  </div>

  <!-- Styled quiz button matching legend styling -->
  <div
    v-else
    class="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-2 transition-all duration-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center"
    @click="openQuizModal"
  >
    <div class="flex items-center gap-1">
      <UIcon name="i-lucide-list-checks" class="text-success-500 flex-shrink-0 text-sm" />
      <span class="text-sm font-medium">{{ t('app.quiz') }}</span>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
