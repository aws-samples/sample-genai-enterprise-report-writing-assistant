<template>
  <div ref="headerContainer" class="chat-header">
    <Alerts />
    <h3 style="font-size: 20px">Write {{ formatCategory(submissionType) }}</h3>
  </div>
  <div app ref="headerContainerUnderlay"></div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, Ref } from "vue";
import { formatCategory } from "@/utils/string";

const props = defineProps(["submissionType"]);

// Element references for resizing the header
const headerContainer: Ref<HTMLDivElement | null> = ref(null);
const headerContainerUnderlay: Ref<HTMLDivElement | null> = ref(null);
let resizeObserver: ResizeObserver | null = null;

// Set the correct sizes when the header or container are resized
const updateHeaderSize = async () => {
  await nextTick();
  if (headerContainer.value && headerContainerUnderlay.value) {
    headerContainer.value.style.width = `${headerContainerUnderlay.value.offsetWidth}px`;
    headerContainerUnderlay.value.style.height = `${
      headerContainer.value.offsetHeight - 50
    }px`;
  }
};

onMounted(() => {
  // Create a resize observer for the main page body
  if (headerContainer.value && headerContainerUnderlay.value) {
    resizeObserver = new ResizeObserver(() => {
      updateHeaderSize();
    });
    resizeObserver.observe(headerContainer.value);
    resizeObserver.observe(headerContainerUnderlay.value);
  }
});

onBeforeUnmount(() => {
  // Cleanup resize observer
  if (resizeObserver && headerContainerUnderlay.value) {
    resizeObserver.disconnect();
  }
});
</script>
