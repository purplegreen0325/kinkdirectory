<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Props for the modal
const props = defineProps<{
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  confirmColor?: 'primary' | 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'neutral'
}>()

// Default values for optional props
const confirmText = props.confirmText || t('app.confirm') || 'Confirm'
const cancelText = props.cancelText || t('app.cancel') || 'Cancel'
const confirmColor = props.confirmColor || 'primary'

// Emit to close with result
const emit = defineEmits(['close'])

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
          @click="cancel"
          color="neutral"
          variant="soft"
        >
          {{ cancelText }}
        </UButton>
        
        <UButton
          @click="confirm"
          :color="confirmColor"
        >
          {{ confirmText }}
        </UButton>
      </div>
    </template>
  </UModal>
</template> 