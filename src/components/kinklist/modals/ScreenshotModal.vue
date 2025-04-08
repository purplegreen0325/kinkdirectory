<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useScreenshot } from '../../../composables/useScreenshot'

const props = defineProps<{
  dataUrl: string
  listName: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'resolve', value: 'download' | 'copied' | false): void
}>()
const { t } = useI18n()
const toast = useToast()
const { takeScreenshot } = useScreenshot()

const imgurUploading = ref(false)
const imgurUrl = ref('')
const error = ref('')
const imageLoading = ref(true)
const screenshotLoading = ref(true)
const screenshotData = ref('')
const hasUploadedOnce = ref(false)
const copyingLink = ref(false)

onMounted(async () => {
  try {
    // Take screenshot after component is mounted
    screenshotData.value = await takeScreenshot()
    screenshotLoading.value = false
  }
  catch (err) {
    error.value = `Failed to take screenshot: ${err instanceof Error ? err.message : String(err)}`
    screenshotLoading.value = false

    toast.add({
      title: t('app.screenshot_error'),
      description: error.value,
      icon: 'i-lucide-x-circle',
      color: 'error',
      duration: 5000,
    })
  }
})

function downloadImage() {
  if (!screenshotData.value)
    return

  const link = document.createElement('a')
  link.href = screenshotData.value
  link.download = `kinklist-${props.listName.replace(/\s+/g, '-').toLowerCase() || 'export'}.png`

  // Safari fix: need to append the link to the document
  document.body.appendChild(link)
  link.click()

  // Remove the link after clicking
  setTimeout(() => {
    document.body.removeChild(link)
  }, 100)

  toast.add({
    title: t('app.screenshot'),
    description: t('app.screenshot_downloaded'),
    color: 'success',
    duration: 3000,
  })
}

function resolveWithDownload() {
  downloadImage()
  emit('resolve', 'download')
}

function copyImgurUrl() {
  if (imgurUrl.value) {
    copyingLink.value = true
    navigator.clipboard.writeText(imgurUrl.value)
    toast.add({
      title: t('app.imgur_link'),
      description: t('app.imgur_link_copied'),
      icon: 'i-lucide-check',
      color: 'success',
      duration: 3000,
    })

    copyingLink.value = false
    emit('resolve', 'copied')
  }
}

function handleImageLoaded() {
  imageLoading.value = false
}

function uploadToImgur() {
  if (hasUploadedOnce.value)
    return

  if (!screenshotData.value) {
    error.value = 'No screenshot data available to upload'
    return
  }

  imgurUploading.value = true
  error.value = ''

  // Extract base64 data without the prefix
  const base64Data = screenshotData.value.split(',')[1]

  fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      'Authorization': 'Client-ID e0ad586c31bdd57',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: base64Data,
      type: 'base64',
    }),
  })
    .then((response) => {
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. You have made too many requests to Imgur.')
        }
        throw new Error('Network response was not ok')
      }
      return response.json()
    })
    .then((result) => {
      hasUploadedOnce.value = true
      imgurUrl.value = `https://i.imgur.com/${result.data.id}.png`
      toast.add({
        title: t('app.imgur_upload_success'),
        description: t('app.imgur_upload_success_description'),
        icon: 'i-lucide-check-circle',
        color: 'success',
        duration: 3000,
      })
    })
    .catch((err) => {
      const errorMessage = `Failed to upload to Imgur: ${err.message}`
      error.value = errorMessage
      console.error(errorMessage, err)

      toast.add({
        title: t('app.imgur_upload_error'),
        description: errorMessage,
        icon: 'i-lucide-x-circle',
        color: 'error',
        duration: 5000,
      })
    })
    .finally(() => {
      imgurUploading.value = false
    })
}

function handleCancel() {
  emit('resolve', false)
}
</script>

<template>
  <UModal
    :title="t('app.screenshot')"
    :description="t('app.screenshot_options')"
  >
    <template #body>
      <div class="mb-4">
        <!-- Screenshot loading state -->
        <div v-if="screenshotLoading" class="w-full">
          <div class="flex flex-col items-center justify-center py-6 gap-4">
            <USkeleton class="h-48 w-full rounded mb-2" />
            <p class="text-sm text-gray-500">
              {{ t('app.taking_screenshot') }}
            </p>
          </div>
        </div>

        <!-- Image container (when screenshot is available) -->
        <div v-else-if="screenshotData">
          <!-- Image loading skeleton -->
          <div v-if="imageLoading" class="w-full">
            <USkeleton class="h-48 w-full rounded mb-4" />
          </div>

          <!-- Actual image (hidden until loaded) -->
          <img
            :src="screenshotData"
            class="w-full max-h-64 object-contain border rounded mb-4" :class="[{ hidden: imageLoading }]"
            @load="handleImageLoaded"
          >
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="flex flex-col items-center justify-center py-6">
          <div class="text-red-500 mb-4">
            {{ error }}
          </div>
        </div>

        <!-- Imgur link display -->
        <div v-if="imgurUrl" class="mb-4">
          <div class="text-sm font-medium mb-1">
            {{ t('app.imgur_link') }}
          </div>
          <UInput
            :model-value="imgurUrl"
            readonly
            class="w-full"
          />
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex justify-end space-x-2">
        <UButton
          variant="outline"
          @click="handleCancel"
        >
          {{ t('app.cancel') }}
        </UButton>

        <UButton
          v-if="screenshotData && !imgurUrl"
          icon="i-lucide-download"
          variant="outline"
          @click="resolveWithDownload"
        >
          {{ t('app.download') }}
        </UButton>

        <UButton
          v-if="screenshotData && !imgurUrl"
          icon="i-lucide-upload-cloud"
          color="primary"
          :loading="imgurUploading"
          :disabled="hasUploadedOnce"
          @click="uploadToImgur"
        >
          {{ t('app.upload_to_imgur') }}
        </UButton>

        <UButton
          v-if="imgurUrl"
          icon="i-lucide-copy"
          color="primary"
          :loading="copyingLink"
          @click="copyImgurUrl"
        >
          {{ copyingLink ? t('app.copied') : t('app.copy_link') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
