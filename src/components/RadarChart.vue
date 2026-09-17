<script setup lang="ts">
import { computed } from 'vue'
import type { Bike } from '../lib/schema'

const props = defineProps<{ bikes: Bike[] }>()

const AXES = [
  { key: 'priceNorm', label: '性价比' },
  { key: 'weightNorm', label: '轻量' },
  { key: 'climb', label: '爬坡' },
  { key: 'carry', label: '携带' },
  { key: 'speeds', label: '变速' },
] as const

type AxisKey = (typeof AXES)[number]['key']

const COLORS = ['var(--color-primary)', 'var(--color-accent)', '#10B981']

const CX = 200
const CY = 200
const R = 140
const N = AXES.length
const ANGLE_STEP = (2 * Math.PI) / N
const OFFSET = -Math.PI / 2 // start from top

/** Normalize a value to 0–1 using global min/max from the full dataset */
const allBikes = props.bikes
const priceMin = Math.min(...allBikes.map((b) => b.priceCny))
const priceMax = Math.max(...allBikes.map((b) => b.priceCny))
const weightMin = Math.min(...allBikes.map((b) => b.weightKg))
const weightMax = Math.max(...allBikes.map((b) => b.weightKg))
const speedsMax = Math.max(...allBikes.map((b) => b.drivetrain.speeds))

function normalize(bike: Bike): Record<AxisKey, number> {
  const priceRange = priceMax - priceMin || 1
  const weightRange = weightMax - weightMin || 1
  return {
    priceNorm: 1 - (bike.priceCny - priceMin) / priceRange, // lower price = better
    weightNorm: 1 - (bike.weightKg - weightMin) / weightRange, // lighter = better
    climb: bike.drivetrain.climbScore / 5,
    carry: bike.folding.carryScore / 5,
    speeds: bike.drivetrain.speeds / speedsMax,
  }
}

function pointOnAxis(index: number, value: number): string {
  const angle = OFFSET + index * ANGLE_STEP
  const x = CX + R * value * Math.cos(angle)
  const y = CY + R * value * Math.sin(angle)
  return `${x.toFixed(1)},${y.toFixed(1)}`
}

function axisPoint(index: number): string {
  return pointOnAxis(index, 1)
}

/** Grid pentagon at a given fraction (0.2, 0.4, etc.) */
function gridPentagon(fraction: number): string {
  return Array.from({ length: N }, (_, i) => pointOnAxis(i, fraction)).join(' ')
}

/** Data polygon for a bike */
function dataPolygon(bike: Bike): string {
  const norms = normalize(bike)
  return AXES.map((a, i) => pointOnAxis(i, Math.max(0.05, norms[a.key]))).join(' ')
}

const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

/** Label position: slightly beyond the 1.0 radius */
function labelPos(index: number): { x: number; y: number } {
  const angle = OFFSET + index * ANGLE_STEP
  const labelR = R + 24
  const x = CX + labelR * Math.cos(angle)
  const y = CY + labelR * Math.sin(angle)
  const anchor = Math.abs(Math.cos(angle)) < 0.1 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
  return { x, y, anchor }
}

const axisLabels = AXES.map((a, i) => ({ ...a, ...labelPos(i) }))
</script>

<template>
  <div class="radar-chart">
    <svg viewBox="0 0 400 400" :width="400" :height="400" role="img" aria-label="车型对比雷达图">
      <!-- Grid -->
      <polygon
        v-for="level in gridLevels"
        :key="level"
        :points="gridPentagon(level)"
        fill="none"
        stroke="var(--color-line)"
        stroke-width="1"
        opacity="0.5"
      />
      <!-- Axis lines -->
      <line
        v-for="i in N"
        :key="'axis-' + i"
        :x1="CX"
        :y1="CY"
        :x2="Number(axisPoint(i - 1).split(',')[0])"
        :y2="Number(axisPoint(i - 1).split(',')[1])"
        stroke="var(--color-line)"
        stroke-width="1"
        opacity="0.5"
      />
      <!-- Data polygons -->
      <polygon
        v-for="(bike, idx) in bikes"
        :key="bike.slug"
        :points="dataPolygon(bike)"
        :fill="COLORS[idx]"
        fill-opacity="0.12"
        :stroke="COLORS[idx]"
        stroke-width="2"
      />
      <!-- Axis labels -->
      <text
        v-for="label in axisLabels"
        :key="label.key"
        :x="label.x"
        :y="label.y"
        :text-anchor="label.anchor"
        fill="var(--color-ink-soft)"
        font-size="13"
        font-family="var(--font-body)"
      >{{ label.label }}</text>
    </svg>
    <div class="radar-legend">
      <span v-for="(bike, idx) in bikes" :key="bike.slug" class="radar-legend-item">
        <span class="radar-legend-dot" :style="{ background: COLORS[idx] }"></span>
        {{ bike.model }}
      </span>
    </div>
  </div>
</template>
