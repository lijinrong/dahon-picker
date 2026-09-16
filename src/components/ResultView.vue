<script setup lang="ts">
import { BUDGET_LABEL, FOLD_LABEL, HEIGHT_LABEL, USE_CASE_LABEL, type Answers } from '../lib/answers'
import type { RankedResult, Recommendation } from '../lib/recommend'
import { reasonsFor, type Reason } from '../lib/reasons'

const props = defineProps<{ result: RankedResult; answers: Answers }>()
const emit = defineEmits<{ restart: [] }>()

function reasons(rec: Recommendation): Reason[] {
  return reasonsFor(rec, props.answers, props.result)
}
</script>

<template>
  <section class="result">
    <h1>根据你的情况,推荐这几款</h1>
    <p class="summary">
      {{ BUDGET_LABEL[answers.budget] }} · {{ USE_CASE_LABEL[answers.useCase] }} ·
      {{ HEIGHT_LABEL[answers.height] }} · 折叠:{{ FOLD_LABEL[answers.fold] }}
    </p>
    <p v-if="result.mode === 'relaxed'" class="empty">
      完全匹配的组合暂时没有,以下是最接近的:
      {{ result.relaxedDimensions.includes('budget') ? '价格超出了你的预算;' : '' }}
      {{ result.relaxedDimensions.includes('height') ? '身高适配略有出入。' : '' }}
    </p>
    <ol class="rec-list" v-if="result.recommendations.length">
      <li v-for="rec in result.recommendations" :key="rec.bike.slug" class="card rec-card">
        <div class="rec-head">
          <h2>
            {{ rec.bike.model }}<span class="alias">{{ rec.bike.marketingName }}</span>
          </h2>
          <p class="price">
            参考价 ¥{{ rec.bike.priceCny }}
            <small>· 更新于 {{ rec.bike.priceUpdatedAt.slice(0, 7) }}</small>
          </p>
        </div>
        <ul class="reasons">
          <li v-for="(r, i) in reasons(rec)" :key="i" :class="['chip', `chip-${r.kind}`]">{{ r.text }}</li>
        </ul>
        <p class="rec-actions">
          <a :href="`/bikes/${rec.bike.slug}`">看详情 →</a>
          <a :href="`/compare?ids=${rec.bike.slug}`">对比其他车型 →</a>
        </p>
      </li>
    </ol>
    <p v-else class="empty">暂时没有可推荐的车型,去 <a href="/bikes">型号百科</a> 看看全部。</p>
    <button class="btn-ghost" type="button" @click="emit('restart')">重新答题</button>
  </section>
</template>
