<template>
  <v-divider style="margin-top: 25px" />
  <div v-if="message.validation.json" style="margin-top: 20px">
    <span v-for="key in Object.keys(message.validation.json)" :key="key">
      <div
        v-if="showValidations"
        style="display: inline-block; margin: 5px 10px 5px 10px"
      >
        <v-chip
          v-if="message.validation.json[key] === true"
          variant="tonal"
          color="green"
        >
          <v-icon
            icon="mdi-checkbox-outline"
            style="color: darkgreen; margin-right: 5px"
          />
          <span style="color: darkgreen">{{
            message.validation.getProperKeyName(key)
          }}</span>
        </v-chip>
        <v-chip
          v-if="message.validation.json[key] === false"
          variant="tonal"
          color="red"
        >
          <v-icon
            icon="mdi-close-box-outline"
            style="color: darkred; margin-right: 5px"
          />
          <span style="color: darkred">{{
            message.validation.getProperKeyName(key)
          }}</span>
        </v-chip>
      </div>
    </span>
    <span></span>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useUiStore } from "@/store/ui";

const props = defineProps(["message"]);
const uiStore = useUiStore();
const { scrollToBottom } = uiStore;

// When the response is loading from the LLM, we hide the validation elements by default
// and then display them when the message finishes loading. After the message has finished
// loading, if the user navigates away and returns to the page, the elements are displayed
// immediately.

// Default value (hidden if message is loading, else visible)
const showValidations = ref(props.message.isLoading ? false : true);

// This watcher triggers the display when the messa
watch(
  () => props.message.isLoading,
  () => {
    if (props.message.isLoading === false) {
      showValidations.value = true;
      scrollToBottom();
    }
  }
);
</script>
