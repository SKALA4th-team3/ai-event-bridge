<script setup>
import { useUiStore } from '@/store/ui.js'
const ui = useUiStore()
const icon = (k) => (k === 'good' ? '✓' : k === 'bad' ? '⚠' : 'ℹ')
</script>

<template>
  <div class="toasts">
    <div v-for="t in ui.toasts" :key="t.id" class="toast" :class="t.kind">
      <span class="ti">{{ icon(t.kind) }}</span><span>{{ t.message }}</span>
    </div>
  </div>
</template>
