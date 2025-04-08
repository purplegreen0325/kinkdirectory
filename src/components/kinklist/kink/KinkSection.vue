<script setup lang="ts">
import type { KinkDefinition } from '../../../types'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'
import KinkRow from './KinkRow.vue'
import KinkSectionContainer from './KinkSectionContainer.vue'
import KinkSectionHeader from './KinkSectionHeader.vue'

const props = defineProps<{
  categoryId: string
  kinks: KinkDefinition[]
}>()
const { t } = useI18n()
const { activeList, isKinkVisibleForRole } = useKinkListState()

// Filter kinks to only show those that are applicable to the user's role
const visibleKinks = computed(() => {
  if (!activeList.value)
    return []

  return props.kinks.filter(kink =>
    isKinkVisibleForRole(kink, activeList.value!.role),
  )
})

// Separate kinks by format
const generalKinks = computed(() => {
  return visibleKinks.value.filter(kink => kink.format === 'general')
})

const roleSpecificKinks = computed(() => {
  return visibleKinks.value.filter(kink => kink.format === 'role_specific')
})

// Check if this subcategory has any visible kinks
const isVisible = computed(() => visibleKinks.value.length > 0)

// Get appropriate column labels based on user role
const columnLabels = computed(() => {
  if (!activeList.value)
    return { left: '', right: '' }

  if (activeList.value.role === 'both') {
    return {
      left: t('app.for_sub'), // dom partner perspective
      right: t('app.as_sub'), // sub self perspective
    }
  }
  else if (activeList.value.role === 'dom') {
    return {
      left: t('app.you_dom'),
      right: t('app.for_sub'),
    }
  }
  else { // 'sub'
    return {
      left: t('app.you_sub'),
      right: t('app.for_dom'),
    }
  }
})

// For 'both' mode: Check if any kink needs the left (dom) column
const needsLeftColumn = computed(() => {
  if (!activeList.value)
    return true

  if (activeList.value.role === 'both') {
    // For 'both' mode, check if any kinks have a dom partner perspective
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      // Check if this kink has a dom partner perspective
      return kink.allowedPerspectives.some(
        rp => rp.role === 'dom' && rp.perspective === 'partner',
      )
    })
  }
  else if (activeList.value.role === 'dom') {
    // Check if any kink has a dom self perspective
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      return kink.allowedPerspectives.some(
        rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'self',
      )
    })
  }
  else { // 'sub'
    // Check if any kink has a sub self perspective
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      return kink.allowedPerspectives.some(
        rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'self',
      )
    })
  }
})

// Check if any kink needs the right column
const needsRightColumn = computed(() => {
  if (!activeList.value)
    return false

  if (activeList.value.role === 'both') {
    // For 'both' mode, check if any kinks have a sub self perspective
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      // Check if this kink has a sub self perspective
      return kink.allowedPerspectives.some(
        rp => rp.role === 'sub' && rp.perspective === 'self',
      )
    })
  }
  else if (activeList.value.role === 'dom') {
    // Check if any kink has a for_sub position
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      // Check if kink has dom partner perspective
      return kink.allowedPerspectives.some(
        rp => (rp.role === 'dom' || rp.role === 'both') && rp.perspective === 'partner',
      )
    })
  }
  else { // 'sub'
    // Check if any kink has a for_dom position
    return roleSpecificKinks.value.some((kink) => {
      if (!kink.allowedPerspectives)
        return false

      // Check if kink has sub partner perspective
      return kink.allowedPerspectives.some(
        rp => (rp.role === 'sub' || rp.role === 'both') && rp.perspective === 'partner',
      )
    })
  }
})

// Determine which column labels to show based on the role and what's needed
const visibleColumnLabels = computed(() => {
  if (!activeList.value)
    return []

  const labels = []
  if (needsLeftColumn.value)
    labels.push(columnLabels.value.left)
  if (needsRightColumn.value)
    labels.push(columnLabels.value.right)
  return labels
})
</script>

<template>
  <div v-if="isVisible" class="mb-2">
    <!-- General Format Kinks Table -->
    <KinkSectionContainer
      v-if="generalKinks.length > 0"
      :is-last-section="roleSpecificKinks.length === 0"
    >
      <template #header>
        <KinkSectionHeader
          :title="t(`categories.${categoryId}`)"
          :column-labels="[t('app.general')]"
          :is-general-section="true"
        />
      </template>

      <template #content>
        <KinkRow
          v-for="(kink, index) in generalKinks"
          :key="kink.id"
          :category-id="categoryId"
          :kink="kink"
          :is-last-item="index === generalKinks.length - 1"
        />
      </template>
    </KinkSectionContainer>

    <!-- Role-Specific Kinks Table -->
    <KinkSectionContainer v-if="roleSpecificKinks.length > 0">
      <template #header>
        <KinkSectionHeader
          :title="t(`categories.${categoryId}`)"
          :column-labels="visibleColumnLabels"
          :is-general-section="false"
        />
      </template>

      <template #content>
        <KinkRow
          v-for="(kink, index) in roleSpecificKinks"
          :key="kink.id"
          :category-id="categoryId"
          :kink="kink"
          :needs-right-column="needsRightColumn"
          :needs-left-column="needsLeftColumn"
          :is-last-item="index === roleSpecificKinks.length - 1"
        />
      </template>
    </KinkSectionContainer>
  </div>
</template>

<style>
/* Remove the text-2xs class definition if it exists */
</style>
