<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Bike } from '../lib/schema'
import { parseIds } from '../lib/urlState'

const base = import.meta.env.BASE_URL
const props = defineProps<{ bikes: Bike[] }>()

const selected = ref<Bike[]>([])

onMounted(() => {
  const search = globalThis.location?.search ?? ''
  const ids = parseIds(search)
  selected.value = ids
    .map((id) => props.bikes.find((b) => b.slug === id))
    .filter((b): b is Bike => Boolean(b))
})

interface DiffRow {
  label: string
  value: (b: Bike) => string
}

const DIFF_ROWS: DiffRow[] = [
  { label: '参考价', value: (b) => `¥${b.priceCny}` },
  { label: '轮径', value: (b) => `${b.wheelSize} 寸` },
  { label: '重量', value: (b) => `${b.weightKg}kg` },
  { label: '变速', value: (b) => `${b.drivetrain.speeds} 速` },
  { label: '爬坡能力', value: (b) => '★'.repeat(b.drivetrain.climbScore) },
  { label: '携带便利', value: (b) => '★'.repeat(b.folding.carryScore) },
  { label: '折叠尺寸', value: (b) => b.folding.foldedSize },
  { label: '适配身高', value: (b) => `${b.heightRangeCm[0]}-${b.heightRangeCm[1]}cm` },
]

const rows = computed(() =>
  DIFF_ROWS.map((r) => ({
    ...r,
    isDiff: selected.value.length > 1 && new Set(selected.value.map(r.value)).size > 1,
  })),
)

/** 构造追加对比车型的 URL（保留已有 ids） */
function addUrl(slug: string): string {
  const existing = selected.value.map((b) => b.slug)
  if (existing.includes(slug)) return `${base}compare?ids=${existing.join(',')}`
  const next = [...existing, slug]
  return `${base}compare?ids=${next.join(',')}`
}

/** 可选车型（排除已选） */
const candidates = computed(() =>
  props.bikes.filter((b) => !selected.value.some((s) => s.slug === b.slug)),
)
</script>

<template>
  <!-- 无任何车型 -->
  <p v-if="selected.length === 0" class="empty">
    至少选择两款车型才能对比:去 <a :href="`${base}bikes`">型号百科</a> 或
    <a :href="base">答题获得推荐</a> 后,在车型上点「加入对比」。
  </p>

  <!-- 仅 1 款：展示该车 + 引导加第二款 -->
  <div v-else-if="selected.length === 1" class="compare">
    <p>已选 <strong>{{ selected[0].model }}</strong> ({{ selected[0].marketingName }})，再选一款即可对比：</p>
    <ul class="bike-list stagger">
      <li v-for="b in candidates" :key="b.slug" class="card">
        <span>
          <a :href="`${base}bikes/${b.slug}`">{{ b.model }}</a>
          <span class="alias">{{ b.marketingName }}</span>
        </span>
        <span class="price"><span class="yen">¥</span>{{ b.priceCny }}</span>
        <a :href="addUrl(b.slug)" class="btn-ghost-accent">加入对比</a>
      </li>
    </ul>
  </div>

  <!-- ≥2 款：完整对比表 -->
  <div v-else class="compare" aria-label="车型对比表">
    <table class="compare-table">
      <thead>
        <tr>
          <th scope="col">对比项</th>
          <th v-for="b in selected" :key="b.slug" scope="col">
            <a :href="`${base}bikes/${b.slug}`">{{ b.model }}</a>
            <span class="alias">{{ b.marketingName }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.label" :class="{ diff: row.isDiff }">
          <th scope="row">{{ row.label }}</th>
          <td v-for="b in selected" :key="b.slug">{{ row.value(b) }}</td>
        </tr>
      </tbody>
    </table>
    <p>高亮行是这几款车有差异的地方。从 <a :href="`${base}bikes`">型号百科</a> 中继续加入对比。</p>
  </div>
</template>
