<script setup lang="ts">
import { ref } from 'vue'
import type { Bike, Naming } from '../lib/schema'
import { decodeModel, type DecodeResult } from '../lib/decode'

const base = import.meta.env.BASE_URL

const props = defineProps<{ naming: Naming; bikes: Bike[] }>()

const input = ref('')
const result = ref<DecodeResult | null>(null)

function run(text: string) {
  input.value = text
  result.value = decodeModel(text, props.naming, props.bikes)
}
</script>

<template>
  <div class="decoder">
    <form @submit.prevent="run(input)">
      <label for="decode-input">输入官方代码(如 KAA084)或市场俗称(如 K3)</label>
      <div class="decode-form-row">
        <input id="decode-input" v-model="input" placeholder="KAA084 / K3" autocomplete="off" />
        <button class="btn-accent" type="submit">解读</button>
      </div>
    </form>

    <div v-if="result?.matched" class="decode-hit">
      <p v-if="result.viaNickname" class="via-nickname">
        {{ result.viaNickname }} 是 {{ result.segments.map((s) => s.char).join('') }} 的市场俗称。
      </p>
      <ol class="seg-list stagger">
        <li v-for="s in result.segments" :key="s.index" class="seg">
          <span class="seg-char">{{ s.char }}</span>
          <span class="seg-meaning">{{ s.meaning ?? '—' }}</span>
          <span v-if="s.note" class="seg-meaning">({{ s.note }})</span>
        </li>
      </ol>
      <p v-if="result.slug"><a :href="`${base}bikes/${result.slug}`">看这款车详情 →</a></p>
    </div>

    <div v-else-if="result" class="decode-miss">
      <p class="empty">没找到「{{ result.input }}」——未收录或拼写有误。</p>
      <p v-if="result.suggestions.length">你想找的是:</p>
      <button
        v-for="s in result.suggestions"
        :key="s"
        class="chip"
        type="button"
        @click="run(s)"
      >{{ s }}</button>
    </div>
  </div>
</template>
