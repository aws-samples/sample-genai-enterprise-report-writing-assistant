<template>
  <!-- The original (before) text -->
  <v-expansion-panels
    v-if="rephraseIsVisible"
    v-model="rephraseIsExpanded"
    style="margin-top: 25px"
    readonly
  >
    <v-expansion-panel rounded="lg">
      <v-expansion-panel-title class="diff-title" static hide-actions>
        <div>Original</div>
        <div style="position: absolute; right: 2px; top: 5px">
          <!-- The show/hide diff button -->
          <v-icon
            :icon="showRephraseDiff ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            @click.stop
            @click="toggleDiffOnOff()"
            size="small"
            :title="
              showRephraseDiff ? 'Diff Highlighting On' : 'Diff Highlighting Off'
            "
            :aria-label="
              showRephraseDiff ? 'Diff Highlighting On' : 'Diff Highlighting Off'
            "
            style="top: 10px; margin-bottom: 0px; margin-right: 15px; color: #444"
          />
        </div>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <div class="diff-text">
          <template v-if="showRephraseDiff">
            <span 
              v-for="(element, index) in parsedBeforeHtml" 
              :key="'before-' + index"
              :class="element.class"
            >
              {{ element.text }}
            </span>
          </template>
          <template v-else>
            {{ message.diff.beforeText }}
          </template>
        </div>
        <CopyTextIcon :text="message.diff.beforeText" />
      </v-expansion-panel-text>
    </v-expansion-panel>

    <v-expansion-panel rounded="lg">
      <v-expansion-panel-title class="diff-title" static hide-actions
        >Rephrased</v-expansion-panel-title
      >
      <v-expansion-panel-text>
        <div class="diff-text">
          <template v-if="showRephraseDiff">
            <span 
              v-for="(element, index) in parsedAfterHtml" 
              :key="'after-' + index"
              :class="element.class"
            >
              {{ element.text }}
            </span>
          </template>
          <template v-else>
            {{ message.diff.afterText }}
          </template>
        </div>
        <CopyTextIcon :text="message.diff.afterText" />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
  <div style="margin-top: 20px">{{ appendedText }}</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { getAfterDiffInstructions } from "@/utils/messages";

const props = defineProps(["message"]);
const uiStore = useUiStore();
const { showRephraseDiff } = storeToRefs(uiStore);

const afterDiffInstructions = getAfterDiffInstructions();

// When the response is loading from the LLM, we hide the diff elements by default and
// then display them when the message finishes loading. After the message has finished
// loading, if the user navigates away and returns to the page, the elements are displayed
// immediately.

// Default values (hidden if message is loading, else visible)
const rephraseIsExpanded = ref([0, 1]); // Keeps both panels expanded
const rephraseIsVisible = ref(props.message.isLoading ? false : true);
const appendedText = ref(props.message.isLoading ? "" : afterDiffInstructions);

// This watcher triggers the display when the message is done loading
watch(
  () => props.message.isLoading,
  () => {
    if (props.message.isLoading === false) {
      rephraseIsVisible.value = true;
      uiStore.scrollToBottom();
      fakeStreamAppendedText(afterDiffInstructions);
      uiStore.scrollToBottom();
    }
  }
);

// Function to toggle diff highlight colors on/off.
function toggleDiffOnOff() {
  uiStore.showRephraseDiff = !uiStore.showRephraseDiff;
}

// Function to "fake stream" the final text at the end of the message.
async function fakeStreamAppendedText(text: string) {
  const fakeTokens = text.split(" ");
  for (let i = 0; i < fakeTokens.length; i++) {
    appendedText.value += fakeTokens[i] + " ";
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  uiStore.scrollToBottom();
}

const parsedBeforeHtml = computed(() => {
  if (!showRephraseDiff.value) return [];
  return parseHtmlContent(props.message.diff.beforeHtml);
});

const parsedAfterHtml = computed(() => {
  if (!showRephraseDiff.value) return [];
  return parseHtmlContent(props.message.diff.afterHtml);
});

interface ParsedElement {
  tag: string;
  text: string | null;
  class?: string;
}

function parseHtmlContent(htmlString: string): ParsedElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const elements: ParsedElement[] = [];
  
  doc.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent) {
        elements.push({
          tag: 'span',
          text: node.textContent
        });
      }
    } else if (node instanceof Element && node.tagName.toLowerCase() === 'span') {
      elements.push({
        tag: 'span',
        text: node.textContent,
        class: node.className
      });
    }
  });
  
  return elements;
}
</script>
