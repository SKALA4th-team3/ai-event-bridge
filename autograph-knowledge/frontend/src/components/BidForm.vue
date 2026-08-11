<script setup>
import { computed, reactive, ref } from 'vue'

const emit = defineEmits(['submit'])
defineProps({ submitting: Boolean })
const form = reactive({ companyName: '', bidAmount: '', expectedRevenue: '', otherCost: '' })
const error = ref('')
const previewProfit = computed(() => Number(form.expectedRevenue||0)-Number(form.bidAmount||0)-Number(form.otherCost||0))
const previewRoi = computed(() => Number(form.bidAmount) > 0 ? previewProfit.value/Number(form.bidAmount)*100 : 0)
const fields = [
  ['companyName','업체명','text','예: SK 이벤트'], ['bidAmount','제안금액','number','420000000'],
  ['expectedRevenue','예상 매출','number','900000000'],
  ['otherCost','기타 예상비용','number','100000000'],
]
function submit() {
  error.value = ''
  if (!form.companyName.trim()) { error.value='업체명을 입력해 주세요.'; return }
  const payload = { companyName: form.companyName.trim() }
  for (const key of ['bidAmount','expectedRevenue','otherCost']) {
    payload[key] = Number(form[key])
    if (!Number.isFinite(payload[key]) || payload[key] < 0) { error.value='금액은 0 이상의 숫자로 입력해 주세요.'; return }
  }
  emit('submit', payload, () => Object.keys(form).forEach(key => form[key]=''))
}
const won = value => `${Number(value).toLocaleString('ko-KR')}원`
</script>

<template>
  <form class="bid-form" @submit.prevent="submit">
    <div class="form-grid">
      <label v-for="field in fields" :key="field[0]">
        <span>{{ field[1] }}</span>
        <input v-model="form[field[0]]" :type="field[2]" :placeholder="field[3]" :min="field[2]==='number'?0:null" required />
      </label>
    </div>
    <div class="bid-preview">
      <span>예상 순이익 <strong>{{ won(previewProfit) }}</strong></span>
      <span>ROI <strong>{{ previewRoi.toFixed(1) }}%</strong></span>
      <button class="primary-button" :disabled="submitting">{{ submitting ? '등록 중…' : '입찰하기' }}</button>
    </div>
    <p v-if="error" class="form-error">{{ error }}</p>
  </form>
</template>
