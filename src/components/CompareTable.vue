<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Bike } from '../lib/schema'
import { parseIds } from '../lib/urlState'

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
</script>

<template>
  <p v-if="selected.length < 2" class="empty">
    至少选择两款车型才能对比:去 <a href="/bikes">型号百科</a> 或
    <a href="/">答题获得推荐</a> 后,在车型上点「加入对比」。
  </p>
  <div v-else class="compare" aria-label="车型对比表">
    <table class="compare-table">
      <thead>
        <tr>
          <th scope="col">对比项</th>
          <th v-for="b in selected" :key="b.slug" scope="col">
            <a :href="`/bikes/${b.slug}`">{{ b.model }}</a>
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
    <p>高亮行是这几款车有差异的地方。</p>
  </div>
</template>
