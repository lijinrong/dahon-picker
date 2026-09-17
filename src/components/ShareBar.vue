<script setup lang="ts">
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{ url?: string; targetSelector: string }>(),
  { url: () => (typeof window !== 'undefined' ? window.location.href : '') }
)

const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined

async function copyLink() {
  try {
    await navigator.clipboard.writeText(props.url)
  } catch {
    // fallback
    const input = document.createElement('input')
    input.value = props.url
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
  }
  showToast('链接已复制!')
}

async function saveImage() {
  const target = document.querySelector(props.targetSelector)
  if (!target) return
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(target as HTMLElement, {
      backgroundColor: getComputedStyle(document.documentElement)
        .getPropertyValue('--color-bg')
        .trim(),
      scale: 2,
    })
    const link = document.createElement('a')
    link.download = 'dahon-recommend.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
    showToast('图片已保存!')
  } catch {
    showToast('保存失败,请截图分享')
  }
}

function showToast(msg: string) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2000)
}
</script>

<template>
  <div class="share-bar">
    <button class="btn-ghost" type="button" @click="copyLink">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      复制链接
    </button>
    <button class="btn-ghost" type="button" @click="saveImage">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      保存图片
    </button>
    <Transition name="toast">
      <span v-if="toast" class="toast" role="status">{{ toast }}</span>
    </Transition>
  </div>
</template>
