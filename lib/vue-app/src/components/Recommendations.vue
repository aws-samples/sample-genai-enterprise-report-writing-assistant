<template>
  <v-expansion-panels class="recommendation-panel" v-model="isPanelExpanded">
    <v-expansion-panel
      rounded="lg"
      style="margin-top: 5px; margin-bottom: 30px"
      @click.stop
    >
      <!-- Expansion panel title bar -->
      <v-expansion-panel-title
        class="genai-insights-title-bar"
        static
        readonly
        hide-actions
      >
        <div style="width: 400px">
          <v-icon
            icon="mdi-lightbulb-on-outline"
            style="color: #003181; margin-right: 5px"
          />
          <span style="position: relative; top: 3px"
            ><strong>AI-Generated Insights</strong></span
          >
        </div>
        <div style="position: absolute; right: 30px; top: -1px">
          <!-- Toggle switch to enable/disable recommendations -->
          <v-switch
            v-model="showGenAiInsights"
            :title="showGenAiInsights ? `AI Insights On` : `AI Insights Off`"
            :aria-label="
              showGenAiInsights ? `AI Insights On` : `AI Insights Off`
            "
            @click.stop
            :disabled="isLoadingRecommendations"
          ></v-switch>
        </div>
      </v-expansion-panel-title>
      <!-- Expansion panel body -->
      <v-expansion-panel-text>
        <!-- Display the cursor while the LLM is thinkign -->
        <span
          v-if="
            isLoadingRecommendations && !getCurrentRecommendation?.text
          "
          class="blink"
        >
          |</span
        >
        <!-- Expansion panel text -->
        <p>{{ getCurrentRecommendation?.text }}</p>
        <ul>
          <li
            style="margin-left: 25px; margin-top: 8px"
            v-for="explanation in getCurrentRecommendation?.explanations"
            v-text="explanation"
            :key="explanation.split(' ')[1]"
          ></li>
        </ul>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useTableStore } from "@/store/table";

const props = defineProps(["category"]);

// Setup UI state values
const uiStore = useUiStore();
const { showGenAiInsights } = storeToRefs(uiStore);

// Setup table state values
const tableStore = useTableStore(`manager-${props.category}`);
const {
  fetchGenAiRecommendations,
  sortItemsByDate,
  sortItemsByRecommendation,
} = tableStore;
const { getCurrentRecommendation, isLoadingRecommendations } =
  storeToRefs(tableStore);

// Use a ref to manage the expansion panel state
const isPanelExpanded = ref(showGenAiInsights.value ? 0 : -1);

// Handle GenAI recommendations toggle On or Off
watch(
  () => showGenAiInsights.value,
  (newValue) => {
    if (newValue === false) {
      isPanelExpanded.value = -1;
      sortItemsByDate();
    } else {
      isPanelExpanded.value = 0;
      if (getCurrentRecommendation.value === undefined) {
        fetchGenAiRecommendations();
      } else {
        sortItemsByRecommendation();
      }
    }
  }
);
</script>
