<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

interface SliderProps {
  modelValue?: number[]
  min?: number
  max?: number
  step?: number
  class?: string
}

const props = withDefaults(defineProps<SliderProps>(), {
  modelValue: () => [0],
  min: 0,
  max: 100,
  step: 1,
})

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const percentage = computed(() => {
  const value = props.modelValue[0] || 0
  return ((value - props.min) / (props.max - props.min)) * 100
})

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', [Number(target.value)])
}
</script>

<template>
  <div :class="cn('relative flex items-center w-full', props.class)">
    <input
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue[0]"
      class="slider-input w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
      :style="{
        background: `linear-gradient(to right, oklch(var(--primary)) 0%, oklch(var(--primary)) ${percentage}%, oklch(var(--muted)) ${percentage}%, oklch(var(--muted)) 100%)`
      }"
      @input="handleInput"
    />
  </div>
</template>

<style scoped>
.slider-input::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: oklch(var(--primary));
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.slider-input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: oklch(var(--primary));
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
