<template>
  <!-- Alerts are added here so they display properly within the component -->
  <Alerts />

  <div style="min-width: 500px">
    <div ref="pageHeaderRef">
      <!-- Query/filter form -->
      <v-row>
        <AssociateViewForm />
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
      <!--
      // Add these two properties to the table to display select checkboxes
      :show-select="items.length > 0 ? true : false"
      select-strategy="page"
      -->
      <v-data-table
        v-if="items"
        v-model="selectedItems"
        :headers="headers"
        :height="items.length > 0 ? tableHeight : `250px`"
        :items="items"
        item-value="row_num"
        :items-per-page="itemsPerPage"
        :page="currentPage"
        :row-props="
          (data: any) => ({
            class: rowClassComputed(data),
            // Uncomment this line to allow row selection by clicking row
            // and also uncomment the handleRowClick function below.
            // 'on-click': () => handleRowClick(data.item.row_num),
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
            :model-value="isSelected({ value: item.row_num, selectable: true })"
            @change="toggleSelect({ value: item.row_num, selectable: true })"
            color="primary"
            hide-details
            :ripple="false"
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
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useTableStore } from "@/store/table";
import TableItem from "@/models/types/TableItem";
import { getSaveSuccessMessage } from "@/utils/messages";
import { formatDate } from "@/utils/table";
import { formatCategory } from "@/utils/string";

// Configure Vue router
const router = useRouter();
const route = useRoute();

// Configure state references
const uiStore = useUiStore();
const { addAlert } = uiStore;
const tableStore = useTableStore("associate");
const { fetchTableItems } = tableStore;
const {
  currentPage,
  isLoadingItems,
  items,
  itemsPerPage,
  selectedItems,
  totalPages,
} = storeToRefs(tableStore);

const headers = [
  { title: "Date", key: "submission_ts", width: "120px", sortable: true },
  { title: "Category", key: "category", width: "170px", sortable: true },
  { title: "Customer", key: "customer", width: "160px", sortable: true },
  { title: "Submission", key: "text", sortable: false },
];

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
  if (selectedItems.value.includes(rowNum)) {
    classList += " selected-table-row";
  }
  return classList.trim();
};

const rowClassComputed = computed(() => {
  return (data: { item: TableItem }) => getRowClass(data.item.row_num);
});


const getSelectedRowFromQuery = () => {
  if (route.query && route.query["saved_ts"]) {
    const selectedItem = items.value.find(
      (item: TableItem) => item.submission_ts === route.query["saved_ts"]
    );
    if (selectedItem) {
      addAlert(
        "success",
        getSaveSuccessMessage(selectedItem.category, selectedItem.customer)
      );
      selectedItems.value = [selectedItem.row_num];
    }
    router.replace(route.path);
  }
};

onMounted(async () => {
  // Set observer to resize the table when needed
  resizeObserver = new ResizeObserver(() => {
    updateTableHeaderPosition();
  });
  resizeObserver.observe(document.body as Element);

  // Fetch items when component mounts
  await fetchTableItems();

  // Highlight newly added record if 'saved_ts' query param exists
  getSelectedRowFromQuery();
});

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>
