<template>
  <v-container fluid style="padding-top: 5px; padding-left: 10px; padding-right: 10px">
    <v-row style="padding: 0; margin: 0">
      <v-col style="margin-bottom: 0px; padding: 0; max-width: 350px">
        <h3 style="font-size: 20px">
          {{ formatCategory(props.category) }}s
          <span style="color: gray"
            >({{ getSelectedItemCount }}/{{ getItemCount }})</span
          >
        </h3>
      </v-col>
      <v-col class="text-right" style="padding: 0">
        <MenuButton
          text="Combine submissions"
          className="outline-button"
          :onClick="handleCombineSubmissions"
          :disabled="getSelectedItemCount < 2 || isLoadingCombinedSubmissions"
        />
        <MenuButton
          :text="`Write ${formatCategory(category).toLowerCase()}`"
          className="secondary-button action-button"
          :to="`/associate/write-${category}`"
        />
      </v-col>
    </v-row>
    <v-row style="padding-top: 5px; margin-bottom: 0px">
      <!-- Month/date select box -->
      <v-col
        style="
          max-width: 225px;
          margin-right: 10px;
          padding-top: 2px;
          padding-bottom: 2px;
        "
      >
        <v-select
          class="form-input"
          v-model="month"
          :items="months"
          density="compact"
          variant="outlined"
          style="width: 225px"
          rounded="lg"
          hide-details
          clearable
          clear-icon="mdi-close"
          menu-icon="mdi-triangle-small-down"
          placeholder="Month"
          @update:model-value="() => fetchTableItems()"
        />
      </v-col>
      <!-- Customer input box -->
      <v-col
        style="
          max-width: 250px;
          margin-right: 10px;
          padding-top: 2px;
          padding-bottom: 2px;
        "
      >
        <v-text-field
          class="form-input"
          v-model="customer"
          density="compact"
          variant="outlined"
          style="width: 250px"
          rounded="lg"
          hide-details
          @keyup.enter="debounce(250, fetchTableItems)"
          @keyup.tab="debounce(250, fetchTableItems)"
          clearable
          clear-icon="mdi-close"
          @click:clear="debounce(250, fetchTableItems)"
          placeholder="Customer name"
        />
      </v-col>
      <!-- Author input box -->
      <v-col
        style="
          max-width: 250px;
          margin-right: 10px;
          padding-top: 2px;
          padding-bottom: 2px;
        "
      >
        <v-text-field
          class="form-input"
          v-model="name"
          density="compact"
          variant="outlined"
          style="width: 250px"
          rounded="lg"
          hide-details
          @keyup.enter="debounce(250, fetchTableItems)"
          @keyup.tab="debounce(250, fetchTableItems)"
          clearable
          clear-icon="mdi-close"
          @click:clear="debounce(250, fetchTableItems)"
          placeholder="Author name"
        />
      </v-col>
      <!-- Refresh search button -->
      <v-col style="max-width: 40px; padding-top: 0; margin-top: -2px">
        <v-icon
          class="icon-button"
          icon="mdi-refresh"
          size="large"
          variant="plain"
          style="margin-top: 4px"
          @click="fetchTableItems()"
          label="Refresh"
          title="Refresh"
          aria-label="Refresh"
        />
      </v-col>
      <!-- Spacer -->
      <v-col style="width: 100%"></v-col>
    </v-row>
  </v-container>
  <CombinedSubmissionsDialog :category="category" />
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useTableStore } from "@/store/table";
import { getPastMonth } from "@/utils/table";
import { formatCategory } from "@/utils/string";

// Configure props
const props = defineProps(["category"]);

// Create a var to hold debounce timeout ids
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

// Configure state references
const uiStore = useUiStore();
const { showCombinedSubmissionsDialog } = storeToRefs(uiStore);
const tableStore = useTableStore(`manager-${props.category}`);
const { fetchCombinedSubmissions, fetchTableItems } = tableStore;
const {
  name,
  customer,
  getItemCount,
  getSelectedItemCount,
  isLoadingCombinedSubmissions,
  month,
} = storeToRefs(tableStore);

const months = ref([
  { title: getPastMonth(0).title, value: 0 },
  { title: getPastMonth(1).title, value: 1 },
  { title: getPastMonth(2).title, value: 2 },
  { title: getPastMonth(3).title, value: 3 },
  { title: getPastMonth(4).title, value: 4 },
  { title: getPastMonth(5).title, value: 5 },
]);

// Function to handle Combine submissions button click
function handleCombineSubmissions() {
  showCombinedSubmissionsDialog.value = true;
  fetchCombinedSubmissions();
}

// This debounce function introduces a small delay to prevent
// multiple requests while the user is updating filter inputs.
async function debounce(
  timeout: number,
  func: (...args: any[]) => void,
  args: any = []
) {
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
  }
  debounceTimeout = setTimeout(async () => {
    await func(...args);
  }, timeout);
}
</script>
