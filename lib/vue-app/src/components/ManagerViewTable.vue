<template>
  <!-- Alerts are added here so they display properly within the component -->
  <Alerts />

  <div style="min-width: 500px">
    <div ref="pageHeaderRef">
      <!-- Query/filter form -->
      <v-row>
        <ManagerViewForm :category="props.category" />
      </v-row>
      <!-- AI generated insights expansion panel -->
      <v-row>
        <Recommendations v-if="items.length > 0" :category="props.category" />
      </v-row>
    </div>
    <!-- Pagination navigation -->
    <v-row style="margin: 0">
      <v-col class="text-right" style="padding: 0; margin-bottom: -25px">
        <v-pagination
          v-if="totalPages"
          style="float: right"
          v-model="currentPage"
          :length="totalPages"
          total-visible="10"
          variant="text"
          density="compact"
          active-color="#000"
          @click.stop
        ></v-pagination>
      </v-col>
    </v-row>
    <!-- Data table -->
    <v-row>
      <v-data-table
        v-if="items"
        v-model="selectedItems"
        :headers="filteredHeaders"
        :height="items.length > 0 ? tableHeight : `250px`"
        :items="items"
        item-value="row_num"
        :show-select="items.length > 0 ? true : false"
        select-strategy="page"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :row-props="
          (data: any) => ({
            class: rowClassComputed(data),
            'on-click': () => handleRowClick(data.item.row_num),
          })
        "
        sort-asc-icon="mdi-triangle-small-down"
        sort-desc-icon="mdi-triangle-small-up"
        :loading="isLoadingItems"
        :no-data-text="isLoadingItems ? '' : 'No records found.'"
        disable-pagination
        fixed-header
        fluid
      >
        <!-- Slots -->
        <!-- Add loading spinner -->
        <template v-slot:[`loader`]="">
          <div class="text-center">
            <v-progress-circular
              indeterminate
              color="#2074d5"
              size="small"
              width="2"
            ></v-progress-circular>
          </div>
        </template>
        <!-- Add formatting to the select all and row select checkboxes -->
        <template
          v-slot:[`header.data-table-select`]="{
            selectAll,
            someSelected,
            allSelected,
          }"
        >
          <v-checkbox
            :indeterminate="someSelected && !allSelected"
            :model-value="allSelected"
            @change="!allSelected ? selectAll(true) : selectAll(false)"
            color="primary"
            density="compact"
            hide-details
            :ripple="false"
          ></v-checkbox>
        </template>
        <template
          v-slot:[`item.data-table-select`]="{ item, isSelected, toggleSelect }"
        >
          <v-checkbox
            style="margin-top: -4px !important"
            :model-value="isSelected({ value: item.row_num, selectable: true })"
            @change="toggleSelect({ value: item.row_num, selectable: true })"
            color="primary"
            hide-details
            :ripple="false"
            @click.prevent
          ></v-checkbox>
        </template>
        <!-- Add formatting to date and category cells -->
        <template v-slot:[`item.submission_ts`]="{ value }">
          <span>{{ formatDate(value) }}</span>
        </template>
        <template v-slot:[`item.category`]="{ value }">
          <span>{{ formatCategory(value) }}</span>
        </template>

        <!-- Hide the default pagination -->
        <template v-slot:bottom> </template>
      </v-data-table>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, onBeforeUnmount } from "vue";
import { storeToRefs } from "pinia";
import { useTableStore } from "@/store/table";
import { useUiStore } from "@/store/ui";
import { formatDate } from "@/utils/table";
import { formatCategory } from "@/utils/string";
import TableItem from "@/models/types/TableItem";

// Configure props
const props = defineProps(["category"]);

// Configure state references
const uiStore = useUiStore();
const { showGenAiInsights } = storeToRefs(uiStore);
const tableStore = useTableStore(`manager-${props.category}`);
const { fetchTableItems } = tableStore;
const {
  currentPage,
  getCurrentRecommendation,
  isLoadingItems,
  isLoadingRecommendations,
  items,
  itemsPerPage,
  selectedItems,
  totalPages,
} = storeToRefs(tableStore);

// Define table structure
const headers = [
  { title: "#", key: "row_num", width: "4ch", sortable: true },
  { title: "Date", key: "submission_ts", width: "120px", sortable: true },
  { title: "Type", key: "category", width: "120px", sortable: true },
  { title: "Name", key: "name", width: "170px", sortable: true },
  { title: "Customer", key: "customer", width: "170px", sortable: true },
  { title: "Submission", key: "text", sortable: false },
];

// Create a computed property to filter the visible headers
const filteredHeaders = computed(() => {
  return headers.filter((header) => {
    // Show row number column when GenAI insights are displayed
    if (header.key === "row_num") {
      return showGenAiInsights.value;
    }
    return true;
  });
});

const tableHeight = ref();
const pageHeaderRef = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

const updateTableHeaderPosition = () => {
  if (pageHeaderRef.value) {
    const tableHeader = document.querySelector("thead");
    if (tableHeader) {
      const pageHeaderRect = pageHeaderRef.value.getBoundingClientRect();
      tableHeight.value = window.innerHeight - pageHeaderRect.bottom - 20;
    }
  }
};

const getRowClass = (rowNum: number) => {
  let classList = "";
  if (
    showGenAiInsights.value &&
    !isLoadingRecommendations.value &&
    getCurrentRecommendation.value?.rowNums.includes(rowNum)
  ) {
    classList += "recommended-table-row";
  }
  if (selectedItems.value.includes(rowNum)) {
    classList += " selected-table-row";
  }
  return classList.trim();
};

const rowClassComputed = computed(() => {
  return (data: { item: TableItem }) => getRowClass(data.item.row_num);
});

const handleRowClick = (rowNum: number) => {
  const index = selectedItems.value.findIndex((i) => i === rowNum);
  if (index === -1) {
    selectedItems.value.push(rowNum);
  } else {
    selectedItems.value.splice(index, 1);
  }
};

onMounted(() => {
  // Set observer to resize the table when needed
  resizeObserver = new ResizeObserver(() => {
    updateTableHeaderPosition();
  });
  resizeObserver.observe(document.body as Element);
  resizeObserver.observe(pageHeaderRef.value as Element);

  // Fetch items when component mounts
  fetchTableItems();
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>
