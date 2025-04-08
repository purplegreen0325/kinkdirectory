<script setup lang="ts">
import type { KinkChoice as KinkChoiceType, KinkDefinition } from '../../../types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import { useSettings } from '../../../composables/useSettings'

defineProps<{
  listId: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
}>()
const { t } = useI18n()
const {
  getVisibleKinksForQuiz,
  setKinkChoice,
  getKinkChoice,
  newUnfilledPositionsCount,
  newKinksAvailable,
} = useKinkListState()
const { kinkChoiceOrder, settings } = useSettings()

// Quiz state variables
const allKinks = ref<Array<{ categoryId: string, kink: KinkDefinition, positions: string[] }>>([])
const currentIndex = ref(0)
const currentPositionIndex = ref(0)
const quizCompleted = ref(false)
const hasStarted = ref(false)
// Track if we're only quizzing new kinks
const isNewKinksOnly = ref(false)
// Track quiz history for back button functionality
const quizHistory = ref<Array<{ kinkIndex: number, positionIndex: number, value: KinkChoiceType }>>([])

// Check for new kinks (added in the last 2 days)
const twoDaysAgo = Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60)

// Active color classes (selected)
const activeColorClasses = {
  0: 'border-gray-400 dark:border-gray-500 bg-gray-300 dark:bg-gray-600',
  1: 'border-blue-500 dark:border-blue-400 bg-blue-500 dark:bg-blue-400',
  2: 'border-green-500 dark:border-green-400 bg-green-500 dark:bg-green-400',
  3: 'border-yellow-500 dark:border-yellow-400 bg-yellow-500 dark:bg-yellow-400',
  4: 'border-orange-500 dark:border-orange-400 bg-orange-500 dark:bg-orange-400',
  5: 'border-red-500 dark:border-red-400 bg-red-500 dark:bg-red-400',
}

// Text color classes
const textColorClasses = {
  0: 'text-gray-500 dark:text-gray-400',
  1: 'text-blue-500 dark:text-blue-400',
  2: 'text-green-500 dark:text-green-400',
  3: 'text-yellow-500 dark:text-yellow-400',
  4: 'text-orange-500 dark:text-orange-400',
  5: 'text-red-500 dark:text-red-400',
}

// Combined values with 0 at the end for the quiz modal
const quizValues = computed(() => {
  const reversedOrder = [...kinkChoiceOrder.value].reverse()
  return [...reversedOrder, 0] as KinkChoiceType[]
})

// Get the current kink and position
const currentKink = computed(() => {
  if (allKinks.value.length === 0 || currentIndex.value >= allKinks.value.length)
    return null
  return allKinks.value[currentIndex.value]
})

const currentPosition = computed(() => {
  if (!currentKink.value || currentPositionIndex.value >= currentKink.value.positions.length)
    return null
  return currentKink.value.positions[currentPositionIndex.value]
})

// Calculate total positions and current position for more accurate progress
const totalPositions = computed(() => {
  return allKinks.value.reduce((total, item) => total + item.positions.length, 0)
})

// Calculate the current position number across all kinks
const currentPositionNumber = computed(() => {
  if (currentIndex.value >= allKinks.value.length) {
    return totalPositions.value
  }

  // Count positions from completed kinks
  let completedPositions = 0
  for (let i = 0; i < currentIndex.value; i++) {
    completedPositions += allKinks.value[i].positions.length
  }

  // Add current position within current kink
  return completedPositions + currentPositionIndex.value + 1
})

// Calculate progress as a percentage
const progress = computed(() => {
  if (totalPositions.value === 0)
    return 0

  return Math.round((currentPositionNumber.value - 1) / totalPositions.value * 100)
})

// Get description text for a rating value
function getRatingDescription(rating: KinkChoiceType): string {
  if (rating === 0)
    return t('choices.not_entered')
  if (rating === 5)
    return t('choices.limit')
  if (rating === 4)
    return t('choices.maybe')
  if (rating === 3)
    return t('choices.indifferent')
  if (rating === 2)
    return t('choices.like')
  if (rating === 1)
    return t('choices.favorite')
  return t('choices.favorite')
}

// Get the currently selected value for the current kink and position
const currentValue = computed((): KinkChoiceType => {
  if (!currentKink.value || !currentPosition.value)
    return 0
  return getKinkChoice(
    currentKink.value.kink,
    currentPosition.value,
  )
})

// Helper function to get position label
function getPositionLabel(position: string): string {
  return t(`app.${position}`)
}

// Provide haptic feedback on mobile devices
function triggerHapticFeedback() {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(50) // Short 50ms vibration
  }
}

// Handle user selecting a rating
function handleSelect(rating: KinkChoiceType) {
  if (!currentKink.value || !currentPosition.value)
    return

  // Save current position to history before moving on
  quizHistory.value.push({
    kinkIndex: currentIndex.value,
    positionIndex: currentPositionIndex.value,
    value: currentValue.value,
  })

  // Provide haptic feedback on mobile
  triggerHapticFeedback()

  // Save the selection
  setKinkChoice(
    currentKink.value.kink,
    currentPosition.value,
    rating,
  )

  // Move to next question immediately
  nextQuestion()
}

// Move to the next position or kink
function nextQuestion() {
  if (!currentKink.value)
    return

  // Check if there are more positions for the current kink
  if (currentPositionIndex.value < currentKink.value.positions.length - 1) {
    // Move to the next position for the current kink
    currentPositionIndex.value++
  }
  else {
    // Move to the next kink and reset position index
    currentIndex.value++
    currentPositionIndex.value = 0

    // Check if we've completed all kinks
    if (currentIndex.value >= allKinks.value.length) {
      quizCompleted.value = true
    }
  }
}

// Go back to the previous question
function previousQuestion() {
  if (quizHistory.value.length === 0)
    return

  const previousState = quizHistory.value.pop()
  if (previousState) {
    currentIndex.value = previousState.kinkIndex
    currentPositionIndex.value = previousState.positionIndex

    // If we went back from completed state, ensure it's not marked completed
    if (quizCompleted.value) {
      quizCompleted.value = false
    }
  }
}

// Start the quiz
function startQuiz() {
  hasStarted.value = true
  isNewKinksOnly.value = false
  allKinks.value = getVisibleKinksForQuiz()
  currentIndex.value = 0
  currentPositionIndex.value = 0
  quizCompleted.value = false
  quizHistory.value = []
}

// Start quiz with only new kinks
function startNewKinksQuiz() {
  hasStarted.value = true
  isNewKinksOnly.value = true
  const allVisibleKinks = getVisibleKinksForQuiz()

  // Filter to only include new kinks with unfilled positions
  const filteredKinks = allVisibleKinks
    .filter(item => item.kink.addedAt && item.kink.addedAt > twoDaysAgo)
    .map((item) => {
      // Create a copy of the item with only unfilled positions
      const unfilled = {
        ...item,
        positions: item.positions.filter((position) => {
          // Check if this position is unfilled
          const value = getKinkChoice(item.kink, position)
          return value === 0
        }),
      }
      return unfilled
    })
    // Only include kinks that have at least one unfilled position after filtering
    .filter(item => item.positions.length > 0)

  allKinks.value = filteredKinks

  // If no kinks with unfilled positions, mark as completed
  if (filteredKinks.length === 0) {
    quizCompleted.value = true
  }
  else {
    currentIndex.value = 0
    currentPositionIndex.value = 0
    quizCompleted.value = false
    quizHistory.value = []
  }
}

// Handle cancel (close modal)
function handleCancel() {
  emit('close')
}

// Show tooltip for the current kink
function getKinkTooltip(): string {
  if (!currentKink.value)
    return ''

  const kinkId = currentKink.value.kink.id
  const categoryId = currentKink.value.categoryId

  return t(`${categoryId}.${kinkId}.tooltip`, '')
}

// Get a pretty name for the current kink
function getKinkLabel(): string {
  if (!currentKink.value)
    return ''

  const kinkId = currentKink.value.kink.id
  const categoryId = currentKink.value.categoryId

  return t(`${categoryId}.${kinkId}.label`, kinkId)
}

// Get the appropriate title based on quiz state
const quizTitle = computed(() => {
  if (quizCompleted.value)
    return t('app.quiz_completed')
  return t('app.quiz')
})
</script>

<template>
  <UModal
    :title="quizTitle"
  >
    <template #title>
      <div class="flex items-center gap-2">
        {{ quizTitle }}
        <UBadge v-if="hasStarted && !quizCompleted && isNewKinksOnly" size="sm" color="primary" variant="soft" class="font-normal">
          <div class="flex items-center gap-1">
            <UIcon name="i-lucide-star" class="text-xs" />
            {{ t('app.new') }}
          </div>
        </UBadge>
      </div>
    </template>

    <template #body>
      <!-- Fixed height container to prevent modal jumps -->
      <div class="min-h-[500px] flex flex-col">
        <!-- Start screen -->
        <div v-if="!hasStarted" class="space-y-6 flex-grow flex flex-col justify-center">
          <!-- Introduction -->
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-start space-x-3">
              <UIcon name="i-lucide-list-checks" class="flex-shrink-0 text-lg text-primary-500 mt-0.5" />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('app.quiz_intro') }}
              </p>
            </div>
          </div>

          <!-- Start buttons -->
          <div class="flex flex-col gap-2 items-center">
            <UButton
              size="lg"
              icon="i-lucide-play"
              color="primary"
              @click="startQuiz"
            >
              {{ t('app.start_quiz') }}
            </UButton>

            <UButton
              v-if="newKinksAvailable"
              size="md"
              icon="i-lucide-star"
              color="primary"
              variant="soft"
              @click="startNewKinksQuiz"
            >
              {{ t('app.quiz_new_kinks_count', { count: newUnfilledPositionsCount }) }}
            </UButton>
          </div>
        </div>

        <!-- Quiz completed screen -->
        <div v-else-if="quizCompleted" class="space-y-6 flex-grow flex flex-col justify-center">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="flex items-start space-x-3">
              <UIcon name="i-lucide-check-circle" class="flex-shrink-0 text-lg text-success-500 mt-0.5" />
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('app.quiz_completed_message') }}
              </p>
            </div>
          </div>

          <!-- Close button -->
          <div class="flex justify-center">
            <UButton
              size="lg"
              icon="i-lucide-check"
              color="primary"
              @click="handleCancel"
            >
              {{ t('app.done') }}
            </UButton>
          </div>
        </div>

        <!-- Quiz question -->
        <div v-else-if="currentKink && currentPosition" class="flex-grow flex flex-col">
          <!-- Progress bar -->
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
            <div class="bg-primary-500 h-2 rounded-full transition-all duration-500 ease-out" :style="{ width: `${progress}%` }" />
          </div>

          <!-- Category and Kink Info -->
          <div class="text-center space-y-1 mb-1">
            <UBadge size="sm" color="neutral" class="mb-0.5">
              {{ t(`categories.${currentKink.categoryId}`) }}
            </UBadge>

            <h3 class="text-lg font-semibold">
              {{ getKinkLabel() }}
            </h3>

            <div class="flex justify-center">
              <UBadge size="md" color="primary" class="mb-0.5">
                {{ getPositionLabel(currentPosition) }}
              </UBadge>
            </div>

            <!-- Fixed height tooltip container -->
            <div class="h-12 flex items-center justify-center">
              <p v-if="getKinkTooltip()" class="text-xs text-gray-600 dark:text-gray-400 overflow-y-auto max-h-full">
                {{ getKinkTooltip() }}
              </p>
              <p v-else class="text-xs text-gray-400 dark:text-gray-600 italic">
                {{ t('app.no_description_available') }}
              </p>
            </div>
          </div>

          <!-- Rating options -->
          <div class="flex flex-col space-y-1 flex-grow">
            <div v-for="rating in quizValues" :key="rating" class="w-full">
              <button
                class="w-full py-2 px-4 text-left rounded-md flex items-center justify-between transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-gray-800"
                :class="[
                  currentValue === rating
                    ? `bg-gray-100 dark:bg-gray-800 font-medium ${textColorClasses[rating]} outline outline-2 outline-current`
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
                ]"
                :data-rating="rating"
                @click="handleSelect(rating)"
              >
                <div class="flex items-center flex-1 min-w-0 mr-2">
                  <span
                    class="w-4 h-4 rounded-full inline-flex items-center justify-center mr-2 flex-shrink-0"
                    :class="rating === 0 ? 'border-2 border-gray-300 dark:border-gray-600' : activeColorClasses[rating]"
                    :data-rating="rating"
                  >
                    <span v-if="settings.showNumbersInChoices" class="text-[8px] font-bold text-white" :class="{ 'dark:text-gray-900': rating === 0 }">{{ rating }}</span>
                  </span>
                  <span class="text-sm break-words">{{ getRatingDescription(rating) }}</span>
                </div>
                <span class="text-lg font-bold flex-shrink-0">{{ settings.showNumbersInChoices && rating === 0 ? '0' : rating === 0 ? '⊘' : rating }}</span>
              </button>
            </div>
          </div>

          <!-- Navigation buttons -->
          <div class="flex justify-between mt-3">
            <UButton
              v-if="quizHistory.length > 0"
              variant="ghost"
              icon="i-lucide-arrow-left"
              @click="previousQuestion"
            >
              {{ t('app.back') }}
            </UButton>
            <div v-else /> <!-- Empty div to maintain layout with flexbox justify-between -->

            <UButton
              variant="ghost"
              @click="nextQuestion"
            >
              {{ t('app.skip') }}
            </UButton>
          </div>
        </div>
      </div>
    </template>

    <!-- Action Buttons -->
    <template #footer>
      <div class="flex justify-between w-full">
        <UButton
          variant="ghost"
          @click="handleCancel"
        >
          {{ t('app.close') }}
        </UButton>

        <div v-if="hasStarted && !quizCompleted" class="text-sm text-gray-500">
          {{ currentPositionNumber }} / {{ totalPositions }}
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Prevent mobile zoom on quick taps */
button {
  touch-action: manipulation;
}
</style>
