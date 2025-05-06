<template>
  <v-row>
    <v-col>
      <v-textarea
        v-model="submissionText"
        :placeholder="`Enter your ${submissionType} for review or ask a question (Shift-ENTER for new line)`"
        required
        variant="outlined"
        rounded="lg"
        :disabled="disabled"
        autocomplete="off"
        rows="3"
        no-resize
        hide-details
        @keydown.enter.exact.prevent="onSubmit"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useChatStore } from "@/store/chat";

const props = defineProps({
  submissionType: { type: String, required: true },
  disabled: { type: Boolean, required: true },
  onSubmit: { type: Function, required: true },
});

const chatStore = useChatStore(props.submissionType);
const { submissionText } = storeToRefs(chatStore);
</script>
