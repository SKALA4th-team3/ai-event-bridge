<script setup>
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.js'
import { useProfileStore } from '@/store/profile.js'
import { useUiStore } from '@/store/ui.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const profile = useProfileStore()
const ui = useUiStore()

const failed = ref(false)
const message = ref('인증 서버에서 돌아오는 중입니다')
const detail = ref('')

onMounted(async () => {
  const { code, error, error_description: desc } = route.query
  if (error) return fail('로그인이 취소되었거나 거절되었습니다', desc || String(error))
  if (!code) return fail('인증 코드를 받지 못했습니다', '로그인 화면에서 다시 시도해 주세요.')

  try {
    await auth.handleCallback(code)

    /* users.role이 백엔드가 아는 유일한 역할 정보입니다.
       INSTRUCTOR를 발주 기관, STUDENT를 참여 업체로 대응시킵니다. */
    const gov = auth.user?.role === 'INSTRUCTOR'
    sessionStorage.removeItem('eb.loginRole')
    const name = auth.user?.name || auth.user?.email?.split('@')[0] || (gov ? '발주 기관' : '참여 업체')
    if (profile.data && (profile.data.kind === 'gov') !== gov) profile.clear()
    if (gov) profile.ensureGov(name); else profile.ensureVendor(name)

    ui.toast(`${gov ? profile.org.name : profile.firm.name} 계정으로 로그인했습니다.`, 'good')
    router.replace(gov ? '/console' : '/home')
  } catch (e) {
    fail('로그인 처리에 실패했습니다', e.response?.data?.error_description || e.message || '')
  }
})
function fail(m, d) { failed.value = true; message.value = m; detail.value = d }
</script>

<template>
  <div class="viewport">
    <div class="view" style="place-items:center">
      <div class="empty">
        <span v-if="!failed" class="big">⋯</span><span v-else class="big">⚠</span>
        <b>{{ message }}</b>
        {{ detail }}
        <template v-if="failed"><br><br>
          <button class="btn pri" @click="router.replace('/login')">로그인 화면으로</button>
        </template>
      </div>
    </div>
  </div>
</template>
