<template>
  <v-dialog
    v-model="showCombinedSubmissionsDialog"
    min-width="500"
    max-width="950"
    :persistent="isLoadingCombinedSubmissions"
  >
    <template v-slot:default="{ isActive }">
      <v-card rounded="lg">
        <v-card-title class="d-flex justify-space-between align-center">
          <div style="margin-left: 10px">
            Combining {{ formatCategory(category) }}s:
          </div>

          <v-btn
            icon="mdi-close"
            variant="text"
            @click="isActive.value = false"
            :disabled="isLoadingCombinedSubmissions"
          ></v-btn>
        </v-card-title>

        <v-card-text style="padding-top: 0">
          <v-textarea
            v-model="combinedSubmissions"
            variant="outlined"
            rounded="lg"
            readonly
            auto-grow
            density="compact"
          />
          <div style="margin-top: -20px; margin-right: 15px">
            <CopyTextIcon
              v-if="!isLoadingCombinedSubmissions"
              :text="combinedSubmissions"
            />
          </div>
        </v-card-text>

        <v-card-actions
          class="d-flex justify-end"
          style="padding-top: 0; margin-bottom: 10px"
        >
        <MenuButton
            text="Combine submissions"
            className="outline-button"
            :onClick="() => (isActive.value = false)"
            
            :disabled="!isLoadingCombinedSubmissions"
            :loading="isLoadingCombinedSubmissions"
          />
          <MenuButton
            text="Close"
            className="outline-button"
            style="margin-right: 15px"
            :onClick="() => (isActive.value = false)"
            :disabled="isLoadingCombinedSubmissions"
          />
        </v-card-actions>
      </v-card>
    </template>
  </v-dialog>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useTableStore } from "@/store/table";
import { formatCategory } from "@/utils/string";

// Configure props
const props = defineProps(["category"]);

// Configure state references
const uiStore = useUiStore();
const { showCombinedSubmissionsDialog } = storeToRefs(uiStore);
const tableStore = useTableStore(`manager-${props.category}`);
const { combinedSubmissions, isLoadingCombinedSubmissions } =
  storeToRefs(tableStore);
</script>
