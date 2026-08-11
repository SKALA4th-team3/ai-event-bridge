<script setup>
import { ref, computed, watch } from 'vue'
import { biddersFor } from '@/constants/demoBidders.js'
import { wonShort, ddayLabel, isUrgent } from '@/composables/useFormat.js'
import { onEscape } from '@/composables/useEscape.js'

/* 공고 하나를 놓고 지원 업체를 견주어 한 곳을 고르는 화면입니다.

   전에는 대시보드 표 아래에 펼쳐졌습니다. 표 위쪽 공고를 누르면
   결과가 화면 밖에 있어 스크롤로 찾아야 했고, 다섯 카드가 모두
   같은 주황 버튼이라 무엇을 먼저 볼지 알 수 없었습니다.

   선정은 되돌리기 번거로운 결정이라 맥락을 좁히는 편이 낫습니다.
   ① AI 1순위를 크게 따로 세우고 판단 근거를 함께 보여 줍니다.
   ② 나머지는 같은 지표가 같은 자리에 오는 비교 카드로 늘어놓습니다.
   ③ 요건 미달은 고를 수 없으니 접어 둡니다 — 다만 몇 곳인지는 밝힙니다. */

const props = defineProps({
  posting: { type: Object, default: null }
})
const emit = defineEmits(['close', 'award'])

const SORTS = [
  { key: 'fit', label: '적합도순' },
  { key: 'records', label: '실적순' },
  { key: 'tenure', label: '업력순' }
]
const sort = ref('fit')

const all = ref([])
watch(() => props.posting, (p) => {
  /* ★ 공고별 지원 업체 조회 API가 없어 시연 명단을 씁니다.
       findByCourseId 가 추가되면 이 줄만 API 호출로 바꾸면 됩니다. */
  all.value = p ? biddersFor(p) : []
  sort.value = 'fit'
}, { immediate: true })

const sorted = computed(() => {
  const k = sort.value
  return [...all.value].sort((a, b) => (b[k] ?? 0) - (a[k] ?? 0) || b.fit - a.fit)
})
/* 요건을 못 채운 곳은 고를 수 없으니 뒤로 물립니다 */
const eligible = computed(() => sorted.value.filter((b) => b.status !== '미달'))
const rejected = computed(() => sorted.value.filter((b) => b.status === '미달'))
const winner = computed(() => all.value.find((b) => b.status === '선정') ?? null)

/* 적합도로 정렬했을 때의 1위가 AI 가 미는 곳입니다.
   다른 기준으로 정렬을 바꿔도 이 사람은 바뀌지 않습니다 — 추천은 하나여야 합니다. */
const top = computed(() =>
  winner.value ?? [...eligible.value].sort((a, b) => b.fit - a.fit)[0] ?? null)
const rest = computed(() => eligible.value.filter((b) => b !== top.value))

const showRejected = ref(false)
const initial = (name) => name.replace(/[()주]/g, '').charAt(0)

function award(b) {
  all.value.forEach((x) => { if (x.status === '선정') x.status = '검토' })
  b.status = '선정'
  emit('award', b)
}
function undo(b) { b.status = '검토' }

onEscape(() => { if (props.posting) emit('close') })
</script>

<template>
  <div v-if="posting" class="ovl bidovl" role="dialog" aria-modal="true"
       aria-label="지원 업체 선정" @click.self="emit('close')">
    <div class="bidsheet">
      <header class="bs-h">
        <div class="bs-t">
          <h3>{{ posting.name }}</h3>
          <p>
            <span>{{ posting.eventName }}</span>
            <span class="sep">·</span>예산 {{ wonShort(posting.budget) }}
            <span class="sep">·</span>
            <b :class="{ hot: isUrgent(posting.dday) }">{{ ddayLabel(posting.dday) }}</b>
            <span class="sep">·</span>{{ all.length }}개사 지원
          </p>
        </div>
        <div class="bs-tools">
          <div class="sortseg" role="group" aria-label="정렬">
            <button v-for="s in SORTS" :key="s.key" :class="{ on: sort === s.key }"
                    @click="sort = s.key">{{ s.label }}</button>
          </div>
          <button class="bs-x" aria-label="닫기" @click="emit('close')">✕</button>
        </div>
      </header>

      <div class="bs-b">
        <!-- ① AI 1순위 -->
        <section v-if="top" class="bs-sec">
          <h4 class="bs-lb">
            <span class="mk">✦</span>{{ winner ? '선정한 업체' : 'AI 1순위' }}
            <em v-if="!winner">적합도 기준 · 정렬을 바꿔도 추천은 그대로입니다</em>
          </h4>
          <article class="topcard" :class="{ won: top.status === '선정' }">
            <div class="tc-l">
              <span class="ava lg">{{ initial(top.name) }}</span>
              <div class="tc-id">
                <b>{{ top.name }}</b>
                <em>{{ top.loc }} · {{ top.category }}</em>
                <span class="tc-tags">
                  <span class="tg">수행 {{ top.records }}건</span>
                  <span class="tg">업력 {{ top.tenure }}년</span>
                </span>
              </div>
            </div>

            <div class="tc-m">
              <div class="tc-fit">
                <span class="n">{{ top.fit }}<i>%</i></span>
                <span class="l">적합도</span>
              </div>
              <span class="bar lg"><i :style="{ width: top.fit + '%' }" /></span>
              <p class="tc-why">{{ top.why }}</p>
            </div>

            <ul class="tc-why2">
              <li v-for="(t, i) in top.reasons" :key="i"><span class="m">·</span>{{ t }}</li>
            </ul>

            <div class="tc-act">
              <button v-if="top.status === '선정'" class="btn sec" @click="undo(top)">선정 취소</button>
              <button v-else class="btn pri" @click="award(top)">이 업체 선정</button>
            </div>
          </article>
        </section>

        <!-- ② 나머지 후보 -->
        <section v-if="rest.length" class="bs-sec">
          <h4 class="bs-lb">다른 후보 <span class="cnt">{{ rest.length }}</span></h4>
          <div class="bidgrid">
            <article v-for="b in rest" :key="b.id" class="bcard">
              <span class="bc-h">
                <span class="ava">{{ initial(b.name) }}</span>
                <span class="bc-id"><b>{{ b.name }}</b><em>{{ b.loc }} · {{ b.category }}</em></span>
              </span>
              <dl class="bc-kv">
                <div><dt>적합도</dt><dd class="strong">{{ b.fit }}%</dd></div>
                <div><dt>수행</dt><dd>{{ b.records }}건</dd></div>
                <div><dt>업력</dt><dd>{{ b.tenure }}년</dd></div>
              </dl>
              <span class="bar"><i :style="{ width: b.fit + '%' }" /></span>
              <button class="btn sec bc-go" @click="award(b)">
                {{ winner ? '이 업체로 변경' : '선정' }}
              </button>
            </article>
          </div>
        </section>

        <!-- ③ 요건 미달 -->
        <section v-if="rejected.length" class="bs-sec">
          <button class="foldbtn" :aria-expanded="showRejected" @click="showRejected = !showRejected">
            <span class="cr" :class="{ on: showRejected }">›</span>
            요건 미달 <b>{{ rejected.length }}개사</b>
            <em>선정할 수 없습니다</em>
          </button>
          <div v-if="showRejected" class="bidgrid">
            <article v-for="b in rejected" :key="b.id" class="bcard out">
              <span class="bc-h">
                <span class="ava">{{ initial(b.name) }}</span>
                <span class="bc-id"><b>{{ b.name }}</b><em>{{ b.loc }} · {{ b.category }}</em></span>
              </span>
              <p class="bc-out">{{ b.why }}</p>
              <ul class="bc-rs">
                <li v-for="(t, i) in b.reasons.filter((r) => r.includes('미충족'))" :key="i">{{ t }}</li>
              </ul>
            </article>
          </div>
        </section>
      </div>

      <footer class="bs-f">
        <span class="bs-note">
          {{ winner ? `${winner.name} 선정 — 결과는 지원 업체에 알림으로 전달됩니다.`
                    : '요건을 충족한 업체 중 한 곳을 고릅니다. 선정 후에도 되돌릴 수 있습니다.' }}
        </span>
        <button class="btn sec" @click="emit('close')">닫기</button>
      </footer>
    </div>
  </div>
</template>
