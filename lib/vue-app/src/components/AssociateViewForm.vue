<template>
  <v-container
    fluid
    style="padding-top: 5px; padding-left: 10px; padding-right: 10px"
  >
    <v-row style="padding: 0; margin: 0">
      <v-col style="margin-bottom: 0px; padding: 0">
        <h3 style="font-size: 20px">Your Submissions</h3>
      </v-col>
      <v-col class="text-right" style="padding: 0">
        <MenuButton
          text="Write submission"
          className="secondary-button action-button"
          :menuItems="Object.values(SubmissionType).map((submissionType) => ({
            text: formatCategory(submissionType),
            to: `/associate/write-${submissionType}`,
          }))"
        />
      </v-col>
    </v-row>
    <v-row style="padding-top: 5px; margin-bottom: 0px">
      <!-- Month/date select box -->
      <v-col
        style="
          max-width: 250px;
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
          style="width: 250px"
          rounded="lg"
          hide-details
          clearable
          clear-icon="mdi-close"
          menu-icon="mdi-triangle-small-down"
          placeholder="Month"
          @update:model-value="() => fetchTableItems()"
        />
      </v-col>
      <!-- Submission category select box -->
      <v-col
        style="
          max-width: 250px;
          margin-right: 10px;
          padding-top: 2px;
          padding-bottom: 2px;
        "
      >
        <v-select
          class="form-input"
          v-model="category"
          :items="Object.values(SubmissionType).map((submissionType) => ({
            title: formatCategory(submissionType),
            value: submissionType,
          }))"
          density="compact"
          variant="outlined"
          style="width: 250px"
          rounded="lg"
          hide-details
          clearable
          clear-icon="mdi-close"
          menu-icon="mdi-triangle-small-down"
          placeholder="Category"
          @update:model-value="() => fetchTableItems()"
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
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { SubmissionType } from "@/models/enums/SubmissionType";
import { useTableStore } from "@/store/table";
import { getPastMonth } from "@/utils/table";
import { formatCategory } from "@/utils/string";

// Configure state references
const tableStore = useTableStore("associate");
const { fetchTableItems } = tableStore;
const { category, month } = storeToRefs(tableStore);

const months = ref([
  { title: getPastMonth(0).title, value: 0 },
  { title: getPastMonth(1).title, value: 1 },
  { title: getPastMonth(2).title, value: 2 },
  { title: getPastMonth(3).title, value: 3 },
  { title: getPastMonth(4).title, value: 4 },
  { title: getPastMonth(5).title, value: 5 },
]);

</script>
