<template>
  <v-tooltip
    v-model="showTooltip"
    :open-on-hover="false"
    text="Copied"
    location="left"
  >
    <template v-slot:activator="{ props }">
      <v-icon
        v-bind="props"
        icon="mdi-checkbox-multiple-blank-outline"
        @click="copyToClipboard(text)"
        size="small"
        title="Copy to Clipboard"
        aria-label="Copy to Clipboard"
        style="left: 9px; margin-top: 4px; color: #333; float: right"
      />
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { ref } from "vue";

defineProps(["text"]);

const showTooltip = ref(false);

async function copyToClipboard(text: string) {
  showTooltip.value = true;
  navigator.clipboard.writeText(text);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  showTooltip.value = false;
}
</script>
