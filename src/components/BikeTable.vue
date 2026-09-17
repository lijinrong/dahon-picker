<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Bike } from '../lib/schema'
import { filterBikes, sortBikes, type BikeFilter, type SortKey } from '../lib/filter'
import { USE_CASES, USE_CASE_LABEL } from '../lib/answers'

const base = import.meta.env.BASE_URL

const props = defineProps<{ bikes: Bike[] }>()

type PriceBand = '' | 'lt2000' | '2000-4000' | '4000-8000' | 'gt8000'
const PRICE_BANDS: Record<Exclude<PriceBand, ''>, [number, number]> = {
  lt2000: [0, 2000],
  '2000-4000': [2000, 4000],
  '4000-8000': [4000, 8000],
  gt8000: [8000, Number.POSITIVE_INFINITY],
}

const wheelSize = ref<number | undefined>(undefined)
const useCase = ref<BikeFilter['useCase']>(undefined)
const priceBand = ref<PriceBand>('')
const minSpeeds = ref<number | undefined>(undefined)
const sort = ref<SortKey>('price-asc')

const wheelOptions = computed(() => [...new Set(props.bikes.map((b) => b.wheelSize))].sort((a, b) => a - b))
const speedOptions = computed(() => [...new Set(props.bikes.map((b) => b.drivetrain.speeds))].sort((a, b) => a - b))

const rows = computed(() => {
  const band = priceBand.value ? PRICE_BANDS[priceBand.value] : undefined
  const f: BikeFilter = {
    wheelSize: wheelSize.value,
    useCase: useCase.value,
    priceMin: band?.[0],
    priceMax: band?.[1],
    minSpeeds: minSpeeds.value,
  }
  return sortBikes(filterBikes(props.bikes, f), sort.value)
})
</script>

<template>
  <div class="bike-table">
    <div class="filters">
      <label>轮径
        <select v-model.number="wheelSize">
          <option :value="undefined">全部</option>
          <option v-for="w in wheelOptions" :key="w" :value="w">{{ w }} 寸</option>
        </select>
      </label>
      <label>用途
        <select v-model="useCase">
          <option :value="undefined">全部</option>
          <option v-for="u in USE_CASES" :key="u" :value="u">{{ USE_CASE_LABEL[u] }}</option>
        </select>
      </label>
      <label>价格
        <select v-model="priceBand">
          <option value="">全部</option>
          <option value="lt2000">2000 以下</option>
          <option value="2000-4000">2000-4000</option>
          <option value="4000-8000">4000-8000</option>
          <option value="gt8000">8000 以上</option>
        </select>
      </label>
      <label>变速
        <select v-model.number="minSpeeds">
          <option :value="undefined">全部</option>
          <option v-for="s in speedOptions" :key="s" :value="s">{{ s }} 速及以上</option>
        </select>
      </label>
      <label>排序
        <select v-model="sort">
          <option value="price-asc">价格从低到高</option>
          <option value="price-desc">价格从高到低</option>
          <option value="weight-asc">重量从轻到重</option>
        </select>
      </label>
    </div>
    <p class="count">共 {{ rows.length }} 款</p>
    <ul class="bike-list stagger">
      <li v-for="b in rows" :key="b.slug" class="card">
        <h2><a :href="`${base}bikes/${b.slug}`">{{ b.model }}</a><span class="alias">{{ b.marketingName }}</span></h2>
        <p>{{ b.wheelSize }} 寸 · {{ b.drivetrain.speeds }} 速 · {{ b.weightKg }}kg</p>
        <p v-if="b.highlights.length" class="card-highlight">{{ b.highlights[0] }}</p>
        <p class="price"><span class="yen">¥</span>{{ b.priceCny }}<small> · 更新于 {{ b.priceUpdatedAt.slice(0, 7) }}</small></p>
      </li>
    </ul>
    <p v-if="rows.length === 0" class="empty">没有符合条件的车型,试试放宽筛选。</p>
  </div>
</template>
