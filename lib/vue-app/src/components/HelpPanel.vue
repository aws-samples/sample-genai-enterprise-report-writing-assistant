<template>
  <!-- Closed sidebar -->
  <v-navigation-drawer
    v-if="!isHelpPanelOpen"
    class="sidebar-closed"
    app
    permanent
    location="right"
    style="position: fixed"
    width="40"
    @click="isHelpPanelOpen = !isHelpPanelOpen"
  >
    <v-icon
      icon="mdi-information-outline"
      size="default"
      variant="plain"
      style="margin-left: 7px; margin-top: 18px"
      label="Open help panel"
      title="Open help panel"
      aria-label="Open help panel"
    />
  </v-navigation-drawer>

  <!-- Open sidebar -->
  <v-navigation-drawer
    v-if="isHelpPanelOpen"
    app
    permanent
    location="right"
    style="position: fixed"
    width="290"
  >
    <div style="padding: 20px 56px 20px 32px">
      <v-icon
        icon="mdi-close"
        size="default"
        variant="plain"
        class="float-right"
        @click="isHelpPanelOpen = !isHelpPanelOpen"
        label="Close help panel"
        title="Close help panel"
        aria-label="Close help panel"
        style="position: relative; left: 40px"
      />
      <p class="sidebar-title">{{ title }}</p>
    </div>
    <v-divider />
    <div class="help-content" style="padding: 20px 32px 20px 32px">
      <slot></slot>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";

// Configure state references
const uiStore = useUiStore();
const { isHelpPanelOpen } = storeToRefs(uiStore);

// Configure props for help content
defineProps(["title", "content"]);
</script>
