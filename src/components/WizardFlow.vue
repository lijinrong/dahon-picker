<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { WIZARD_QUESTIONS, type Answers } from '../lib/answers'
import { encodeAnswers, parseAnswers } from '../lib/urlState'
import { recommend, type RankedResult } from '../lib/recommend'
import type { Bike } from '../lib/schema'
import ResultView from './ResultView.vue'

const base = import.meta.env.BASE_URL

const props = withDefaults(defineProps<{ mode: 'quiz' | 'result'; bikes?: Bike[] }>(), {
  bikes: () => [],
})

const step = ref(0)
const partial = ref<Partial<Answers>>({})
const current = computed(() => WIZARD_QUESTIONS[step.value])

const answers = ref<Answers | null>(null)
const result = ref<RankedResult | null>(null)

onMounted(() => {
  if (props.mode !== 'result') return
  const parsed = parseAnswers(window.location.search)
  if (!parsed) {
    window.location.replace(base)
    return
  }
  answers.value = parsed
  result.value = recommend(parsed, props.bikes)
})

function choose(key: keyof Answers, value: string) {
  partial.value = { ...partial.value, [key]: value }
  if (step.value < WIZARD_QUESTIONS.length - 1) {
    step.value += 1
  } else {
    window.location.assign(base + 'result?' + encodeAnswers({ ...partial.value } as Answers))
  }
}

function back() {
  if (step.value > 0) step.value -= 1
}
</script>

<template>
  <ResultView
    v-if="mode === 'result' && result && answers"
    :result="result"
    :answers="answers"
    @restart="() => window.location.assign(base)"
  />
  <p v-else-if="mode === 'result'" class="empty">正在生成推荐…</p>
  <div v-else class="wizard">
    <progress :value="step" :max="WIZARD_QUESTIONS.length" aria-label="答题进度" />
    <h2>{{ current.title }}</h2>
    <div class="options">
      <button
        v-for="opt in current.options"
        :key="opt.value"
        class="option-btn"
        type="button"
        @click="choose(current.key, opt.value)"
      >{{ opt.label }}</button>
    </div>
    <button v-if="step > 0" class="btn-ghost" type="button" @click="back">上一题</button>
  </div>
</template>
