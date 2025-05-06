<template>
  <div :key="message.id" :id="`msg` + message.id" ref="messageRef">
    <!-- Display human message -->
    <div v-if="message.sender === 'human'" class="chat-message-human">
      {{ message.text }}
    </div>

    <!-- Display assistant message -->
    <div v-if="message.sender === 'assistant'" class="chat-message-assistant">
      <!-- Display the message text -->
      <span>{{ message.text }}</span>
      <!-- Display the cursor while a message is rendering -->
      <span v-if="message.isLoading" class="blink"> |</span>
      <!-- Display the validation state for validation responses -->
      <ValidationStatus v-if="message.validation.json" :message="message" />
      <!-- Display the diff for rephrase responses -->
      <RephraseDiff
        v-if="message.diff.shouldRender() && !message.error"
        :message="message"
      />
      <!-- Display an error message if the LLM response has failed -->
      <div v-if="message.error">
        <br v-if="message.text" />
        <v-icon
          icon="mdi-alert-circle-outline"
          size="default"
          color="#8B0000"
        />
        <span style="color: #8b0000; padding-left: 5px">
          {{ getErrorMessage() }}</span
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useUiStore } from "@/store/ui";

const props = defineProps(["message"]);
const uiStore = useUiStore();
const { scrollToBottom } = uiStore;

function getErrorMessage() {
  if (String(props.message.error).includes("throttlingException")) {
    return "The service is busy. Please try your request again in a few moments.";
  } else if (String(props.message.error) === "Response timeout") {
    return "Response timeout. Please try your request again.";
  } else {
    return "There was an error communicating with the assistant. Please try again.";
  }
}

// Scrolling behavior:
// - Here we add a resize observer on the chat message window to scroll
//   the page to the bottom when a new message or text is added.

// Create a ref to the chat window so we can observe it
const messageRef = ref<HTMLDivElement | null>(null);

// Create a resize observer to watch the chat message container
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  // Set the resize observer on the chat message window when component mounts
  resizeObserver = new ResizeObserver(() => {
    if (props.message.isLoading) {
      scrollToBottom();
    }
  });
  resizeObserver.observe(messageRef.value as Element);

  // Unset the resize observer when the chat message is finished loading
  watch(
    () => props.message.isLoading,
    (isLoading) => {
      if (!isLoading && resizeObserver) {
        resizeObserver.disconnect();
      }
    }
  );
});

onBeforeUnmount(() => {
  // Cleanup the observer just in case
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});
</script>
