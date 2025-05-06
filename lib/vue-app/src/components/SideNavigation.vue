<template>
  <!-- Closed sidebar -->
  <v-navigation-drawer
    v-if="!isSideNavOpen"
    class="sidebar-closed"
    app
    permanent
    location="left"
    style="position: fixed"
    width="40"
    @click="isSideNavOpen = !isSideNavOpen"
  >
    <v-icon
      icon="mdi-menu"
      size="default"
      variant="plain"
      style="margin-left: 8px; margin-top: 18px"
      label="Open side navigation"
      title="Open side navigation"
      aria-label="Open side navigation"
    />
  </v-navigation-drawer>

  <!-- Open sidebar -->
  <v-navigation-drawer
    v-if="isSideNavOpen"
    app
    permanent
    location="left"
    style="position: fixed"
    width="280"
  >
    <div style="padding: 20px 56px 20px 32px">
      <v-icon
        icon="mdi-close"
        size="default"
        variant="plain"
        class="float-right"
        @click="isSideNavOpen = !isSideNavOpen"
        label="Close side navigation"
        title="Close side navigation"
        aria-label="Close side navigation"
        style="position: relative; left: 40px"
      />
      <button
        @click="router.push(titleLink)"
        class="sidebar-title"
        :aria-label="title"
      >
        {{ title }}
      </button>
    </div>
    <v-divider />
    <v-list nav style="padding: 20px 32px 20px 32px">
      <div v-for="link in links" :key="link.title">
        <!-- Display links -->
        <v-list-item
          v-if="'to' in link ? link.to : null"
          class="sidebar-link"
          active-class="sidebar-link-active"
          :key="link.to"
          :to="link.to"
          :title="link.title"
          :aria-label="link.title"
          variant="flat"
          density="compact"
          rounded="lg"
        />
        <!-- Display groups -->
        <div v-else>
          <div class="sidebar-link-group">
            <v-icon icon="mdi-triangle-small-down"></v-icon>
            {{ link.title }}
          </div>
          <v-list-item
            v-for="subitem in link.group"
            class="sidebar-link sidebar-sub-item"
            active-class="sidebar-link-active"
            :key="subitem.title"
            :to="subitem.to"
            :title="subitem.title"
            :aria-label="subitem.title"
            variant="flat"
            density="compact"
            rounded="lg"
          />
        </div>
      </div>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useRouter } from "vue-router";

// Configure router for navigation
const router = useRouter();

// Configure state references
const uiStore = useUiStore();
const { isSideNavOpen } = storeToRefs(uiStore);

// Configure props for link definitions
defineProps(["title", "titleLink", "links"]);
</script>
