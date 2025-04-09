<script setup lang="ts">
import type { KinkChoice as KinkChoiceType, KinkDefinition } from '../../../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import KinkChoice from './KinkChoice.vue'
import KinkColumn from './KinkColumn.vue'
import KinkLabel from './KinkLabel.vue'
import KinkRowLayout from './KinkRowLayout.vue'

const props = defineProps<{
  categoryId: string
  kink: KinkDefinition
  needsRightColumn?: boolean
  needsLeftColumn?: boolean
  isLastItem?: boolean
}>()
const { t } = useI18n()
const { setKinkChoice, getKinkChoice, activeList, getKinkPositions } = useKinkListState()

function handleClick(position: string, selectedValue: KinkChoiceType) {
  // If user clicks the "Not Entered" (0) button or the currently selected value, set to 0
  const currentValue = getKinkChoice(props.kink, position)

  // If clicking the same value or explicitly clicking 0, set to 0
  // Otherwise set to the selected value
  const newValue = (currentValue === selectedValue || selectedValue === 0) ? 0 : selectedValue
  setKinkChoice(props.kink, position, newValue)
}

// Compute label and tooltip paths based on category and kink ID
const labelPath = `${props.categoryId}.${props.kink.id}.label`
const tooltipPath = `${props.categoryId}.${props.kink.id}.tooltip`

// Get applicable positions for this kink
const applicablePositions = computed(() => {
  if (!activeList.value)
    return []
  return getKinkPositions(props.kink, activeList.value.role)
})

// Get position labels based on user role and position
function getPositionLabel(position: string): string {
  if (position === 'general')
    return t('app.general')
  if (activeList.value?.role === 'both') {
    if (position === 'as_sub')
      return t('app.receiving')
    if (position === 'for_sub')
      return t('app.giving')
  }
  if (activeList.value?.role === 'dom') {
    if (position === 'for_sub')
      return t('app.giving')
    if (position === 'as_dom')
      return t('app.receiving')
  }
  if (activeList.value?.role === 'sub') {
    if (position === 'as_sub')
      return t('app.receiving')
    if (position === 'for_dom')
      return t('app.giving')
  }
  return ''
}

// Get the position to display in the left column
const leftColumnPosition = computed(() => {
  if (props.kink.format === 'general')
    return 'general'

  if (activeList.value?.role === 'both') {
    return 'for_sub' // dom partner perspective (dom giving to sub)
  }
  else if (activeList.value?.role === 'dom') {
    return 'for_sub' // Changed from 'as_dom' to 'for_sub'
  }
  else { // sub
    return 'as_sub'
  }
})

// Get the position to display in the right column
const rightColumnPosition = computed(() => {
  if (props.kink.format === 'general')
    return 'general'

  if (activeList.value?.role === 'both') {
    return 'as_sub' // sub self perspective
  }
  else if (activeList.value?.role === 'dom') {
    return 'as_dom' // Changed from 'for_sub' to 'as_dom'
  }
  else { // sub
    return 'for_dom'
  }
})

// Check if a position is applicable for the current kink
function isPositionApplicable(position: string) {
  // Special handling for 'both' mode
  if (activeList.value?.role === 'both') {
    if (position === 'for_sub') {
      // Check if this kink has a dom partner perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'dom' && rp.perspective === 'partner') || (rp.role === 'sub' && rp.perspective === 'partner'),
      ) ?? false
    }
    else if (position === 'as_sub') {
      // Check if this kink has a sub self perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'sub' && rp.perspective === 'self') || (rp.role === 'dom' && rp.perspective === 'self'),
      ) ?? false
    }

    return false
  }
  // Special handling for 'dom' mode
  else if (activeList.value?.role === 'dom') {
    if (position === 'as_dom') {
      // Check if this kink has a dom self perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'dom' && rp.perspective === 'self'),
      ) ?? false
    }
    else if (position === 'for_sub') {
      // Check if this kink has a dom partner perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'dom' && rp.perspective === 'partner'),
      ) ?? false
    }
  }
  // Special handling for 'sub' mode
  else if (activeList.value?.role === 'sub') {
    if (position === 'as_sub') {
      // Check if this kink has a sub self perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'sub' && rp.perspective === 'self'),
      ) ?? false
    }
    else if (position === 'for_dom') {
      // Check if this kink has a sub partner perspective
      return props.kink.allowedPerspectives?.some(
        rp => (rp.role === 'sub' && rp.perspective === 'partner'),
      ) ?? false
    }
  }

  // For any other case, use applicablePositions
  return applicablePositions.value.includes(position)
}
</script>

<template>
  <!-- leftColumnPosition: {{ leftColumnPosition }} - rightColumnPosition: {{ rightColumnPosition }} -->
  <KinkRowLayout :is-last-item="isLastItem">
    <template #label>
      <KinkLabel
        :label="t(labelPath)"
        :tooltip="t(tooltipPath)"
        :added-at="kink.addedAt"
      />
    </template>

    <template #choices>
      <!-- General format kinks (single choice) -->
      <template v-if="kink.format === 'general'">
        <td class="text-center py-2 px-0 sm:px-2 min-w-[40px] sm:min-w-[50px]">
          <div class="flex justify-center items-center">
            <KinkChoice
              :value="getKinkChoice(kink, 'general')"
              :on-click="(value) => handleClick('general', value)"
              :kink-name="t(labelPath)"
              :tooltip="t(tooltipPath)"
            />
          </div>
        </td>
      </template>

      <!-- Role-specific kinks with consistent column layout -->
      <template v-else-if="kink.format === 'role_specific'">
        <!-- First Column (You) - only if needed -->
        <KinkColumn
          v-if="needsLeftColumn"
          :is-empty="!isPositionApplicable(leftColumnPosition)"
          :position="leftColumnPosition"
          :value="getKinkChoice(kink, leftColumnPosition)"
          :kink-name="t(labelPath)"
          :position-label="getPositionLabel(leftColumnPosition)"
          :tooltip="t(tooltipPath)"
          :on-click="(value) => handleClick(leftColumnPosition, value)"
        />

        <!-- Second Column (For your dom/sub) - only if we need right column -->
        <KinkColumn
          v-if="needsRightColumn"
          :is-empty="!isPositionApplicable(rightColumnPosition)"
          :position="rightColumnPosition"
          :value="getKinkChoice(kink, rightColumnPosition)"
          :kink-name="t(labelPath)"
          :position-label="getPositionLabel(rightColumnPosition)"
          :tooltip="t(tooltipPath)"
          :on-click="(value) => handleClick(rightColumnPosition, value)"
        />
      </template>
    </template>
  </KinkRowLayout>
</template>
