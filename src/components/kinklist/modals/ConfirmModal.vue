<script setup lang="ts">
import { useI18n } from 'vue-i18n'

// Props for the modal
const props = defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'neutral'
}>()

// Emit to close with result
const emit = defineEmits(['close'])

const { t } = useI18n()

// Default values for optional props
const confirmText = props.confirmText || t('app.confirm') || 'Confirm'
const cancelText = props.cancelText || t('app.cancel') || 'Cancel'
const confirmColor = props.confirmColor || 'primary'

// Confirm action
function confirm() {
  emit('close', true)
}

// Cancel action
function cancel() {
  emit('close', false)
}
</script>

<template>
  <UModal :title="title">
    <template #body>
      <p>{{ message }}</p>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          color="neutral"
          variant="soft"
          @click="cancel"
        >
          {{ cancelText }}
        </UButton>

        <UButton
          :color="confirmColor"
          @click="confirm"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
