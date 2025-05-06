<template>
  <v-stepper
    class="chat-input-stepper"
    :model-value="submissionStep + 1"
    bg-color="#232F3E"
    rounded="lg"
    flat
  >
    <v-stepper-header>
      <v-stepper-item
        class="chat-input-stepper-button"
        selected-class="chat-input-stepper-button-selected"
        title="Write and Validate"
        :value="SubmissionStep.VALIDATE + 1"
        color="#2074d5"
      >
      </v-stepper-item>

      <v-divider></v-divider>

      <v-stepper-item
        class="chat-input-stepper-button"
        selected-class="chat-input-stepper-button-selected"
        title="Rephrase"
        :value="SubmissionStep.REPHRASE + 1"
        color="#2074d5"
      ></v-stepper-item>

      <v-divider></v-divider>

      <v-stepper-item
        class="chat-input-stepper-button"
        selected-class="chat-input-stepper-button-selected"
        title="Save"
        :value="SubmissionStep.SAVE + 1"
        color="#2074d5"
      ></v-stepper-item>
    </v-stepper-header>
  </v-stepper>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useChatStore } from "@/store/chat";
import SubmissionStep from "@/models/enums/SubmissionStep";

const props = defineProps(["submissionType"]);

// Configure state references
const chatStore = useChatStore(props.submissionType);
const { submissionStep } = storeToRefs(chatStore);
</script>
