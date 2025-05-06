<template>
  <div v-if="alerts.length > 0" class="alert-container">
    <v-alert
      v-for="alert in alerts"
      class="alert"
      :key="alert.id"
      :type="alert.type"
      :text="alert.text"
      closable
      @click:close="removeAlert(alert.id)"
      variant="flat"
      rounded="lg"
    ></v-alert>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";

// Configure state references
const uiStore = useUiStore();
const { alerts } = storeToRefs(uiStore);
const { removeAlert } = uiStore;
</script>
