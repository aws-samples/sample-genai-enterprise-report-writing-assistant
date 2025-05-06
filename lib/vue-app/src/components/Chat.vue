<template>
  <!-- Container for chat message history -->
  <div app ref="bodyContainer" class="chat-message-container">
    <ChatMessage
      v-for="message in messages"
      :key="message.id"
      :message="message"
    />
  </div>
  <!-- The chat input panel -->
  <v-footer app style="position: fixed">
    <v-container fluid>
      <v-row v-if="submissionStep <= SubmissionStep.SAVE">
        <ChatStepper :submissionType="submissionType" />
      </v-row>
      <v-row>
        <ChatInputForm :submissionType="submissionType" />
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useChatStore } from "@/store/chat";
import SubmissionStep from "@/models/enums/SubmissionStep";

const props = defineProps(["submissionType"]);

// Configure state references
const currentSubmissionType = ref(props.submissionType);
const chatStore = useChatStore(currentSubmissionType.value);
const { resetChatSession } = chatStore;
const { messages, submissionStep } = storeToRefs(chatStore);

onMounted(() => {
  // Setup chat session when component loads
  if (messages.value.length <= 1) {
    resetChatSession();
  }
});

</script>
