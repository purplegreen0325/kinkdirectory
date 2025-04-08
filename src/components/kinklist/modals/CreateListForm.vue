<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useKinkListState } from '../../../composables/useKinkList'

const emit = defineEmits<{
  (e: 'close', id?: string): void
}>()
const { t } = useI18n()
const { createList } = useKinkListState()

const name = ref('')
const role = ref<'sub' | 'dom' | 'both'>('both')

const roles = [
  { value: 'sub', label: t('roles.sub'), icon: 'i-lucide-heart' },
  { value: 'dom', label: t('roles.dom'), icon: 'i-lucide-crown' },
  { value: 'both', label: t('roles.both'), icon: 'i-lucide-heart-handshake' },
]

function handleCreate() {
  if (!name.value.trim())
    return

  const id = createList(name.value.trim(), role.value)
  emit('close', id)
}

function handleCancel() {
  emit('close')
}
</script>

<template>
  <UModal
    :title="t('app.create_new_list')"
    :description="t('app.create_list_description')"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Introduction -->
        <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-600 dark:text-gray-400">
            {{ t('app.create_list_intro') }}
          </p>
        </div>

        <!-- List Name Section -->
        <div class="space-y-2">
          <label for="list-name" class="block text-sm font-medium">{{ t('app.list_name') }}</label>
          <UInput
            id="list-name"
            v-model="name"
            class="w-full"
            :placeholder="t('app.list_name_placeholder')"
            @keydown.enter="handleCreate"
          />
        </div>

        <!-- Role Selection Section -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('app.role') }}</label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {{ t('app.role_explanation') }}
            </p>
          </div>

          <!-- Custom Radio Group -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              v-for="item in roles"
              :key="item.value"
              class="cursor-pointer p-3 rounded-lg border transition-all flex items-center space-x-3" :class="[
                role === item.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              ]"
              @click="role = item.value as 'sub' | 'dom' | 'both'"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center" :class="[
                  role === item.value ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-gray-800',
                ]"
              >
                <UIcon :name="item.icon" class="text-lg" :class="role === item.value ? 'text-primary-500' : 'text-gray-500'" />
              </div>
              <div>
                <div class="font-medium text-sm">
                  {{ item.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Role Explanation -->
          <div
            class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border-l-4"
            :class="{
              'border-violet-400': role === 'sub',
              'border-red-400': role === 'dom',
              'border-blue-400': role === 'both',
            }"
          >
            <p v-if="role === 'sub'" class="text-sm">
              {{ t('app.role_sub_explanation') }}
            </p>
            <p v-else-if="role === 'dom'" class="text-sm">
              {{ t('app.role_dom_explanation') }}
            </p>
            <p v-else class="text-sm">
              {{ t('app.role_both_explanation') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <UButton
          variant="ghost"
          @click="handleCancel"
        >
          {{ t('app.cancel') }}
        </UButton>
        <UButton
          variant="solid"
          color="primary"
          :disabled="!name.trim()"
          icon="i-heroicons-check"
          @click="handleCreate"
        >
          {{ t('app.create') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
