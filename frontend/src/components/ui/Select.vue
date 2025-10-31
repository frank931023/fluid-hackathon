<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from '@headlessui/vue'
import { Check, ChevronDown } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  modelValue?: string
  placeholder?: string
  options?: SelectOption[]
  class?: string
}

const props = withDefaults(defineProps<SelectProps>(), {
  placeholder: 'Select an option',
  options: () => [],
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedOption = computed(() => {
  return props.options.find(opt => opt.value === props.modelValue)
})
</script>

<template>
  <Listbox
    :model-value="modelValue"
    @update:model-value="(value) => emit('update:modelValue', value)"
  >
    <div class="relative">
      <ListboxButton
        :class="cn(
          'relative w-full cursor-default rounded-lg bg-background border border-input py-2 pl-3 pr-10 text-left shadow-sm focus:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring sm:text-sm',
          props.class
        )"
      >
        <span class="block truncate">
          {{ selectedOption?.label || placeholder }}
        </span>
        <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </span>
      </ListboxButton>

      <transition
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <ListboxOptions
          class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-popover py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm"
        >
          <ListboxOption
            v-for="option in options"
            :key="option.value"
            v-slot="{ active, selected }"
            :value="option.value"
            as="template"
          >
            <li
              :class="[
                active ? 'bg-accent text-accent-foreground' : 'text-foreground',
                'relative cursor-default select-none py-2 pl-10 pr-4',
              ]"
            >
              <span :class="[selected ? 'font-medium' : 'font-normal', 'block truncate']">
                {{ option.label }}
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-primary"
              >
                <Check class="h-4 w-4" aria-hidden="true" />
              </span>
            </li>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>
