<script setup>
import { useUiStore } from '@/store/ui.js'
import { onEscape } from '@/composables/useEscape.js'
const ui = useUiStore()

/* Esc 로 닫습니다 */
onEscape(() => { if (ui.drawerOpen) ui.closeDrawer() })
</script>

<template>
  <template v-if="ui.drawerOpen">
    <div class="dwbg" @click="ui.closeDrawer()" />
    <div class="drawer" role="dialog" aria-modal="true" aria-label="알림">
      <div class="dwhead">
        <h4>알림</h4>
        <button class="cl" aria-label="닫기" @click="ui.closeDrawer()">✕</button>
      </div>
      <div class="dwlist">
        <div v-for="(n, i) in ui.notifications" :key="i" class="nitem" :class="{ read: n.read }">
          <span class="nd" />
          <span><b>{{ n.title }}</b><span>{{ n.sub }}</span><time>{{ n.at }}</time></span>
        </div>
        <div v-if="!ui.notifications.length" class="empty">
          <span class="big">🔔</span><b>새 알림이 없습니다</b>
        </div>
      </div>
    </div>
  </template>
</template>
