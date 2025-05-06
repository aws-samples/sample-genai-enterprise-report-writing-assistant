<template>
  <v-container fluid>
    <ChatInputCustomerTextBox
      v-if="submissionStep === SubmissionStep.SAVE"
      :submissionType="submissionType"
      :isLoading="isLoadingExtractCustomer"
      :disabled="isLoadingChatMessage || isLoadingExtractCustomer || isLoadingSaveButton"
    />

    <ChatInputSubmissionTextBox
      v-if="
        [
          SubmissionStep.VALIDATE,
          SubmissionStep.REPHRASE,
          SubmissionStep.SAVE,
        ].includes(submissionStep)
      "
      :submissionType="submissionType"
      :disabled="isLoadingChatMessage || isLoadingExtractCustomer || isLoadingQueryModel || isLoadingSaveButton"
      :onSubmit="submitForm"
    />

    <v-row>
      <v-col style="text-align: right; padding-top: 5px; padding-bottom: 20px">
        <MenuButton
          v-if="hasActiveSession"
          text="New session"
          className="outline-button"
          float="left"
          :onClick="() => resetChatSession()"
          :disabled="isLoadingChatMessage || isLoadingQueryModel || isLoadingExtractCustomer || isLoadingSaveButton"
        />
        <MenuButton
          v-if="
            [SubmissionStep.REPHRASE, SubmissionStep.SAVE].includes(
              submissionStep
            )
          "
          text="Previous"
          className="outline-button"
          :onClick="() => handlePrevClick()"
          :disabled="isLoadingChatMessage || isLoadingQueryModel || isLoadingExtractCustomer"
        />
        <MenuButton
          v-if="submissionStep === SubmissionStep.VALIDATE"
          text="Send"
          className="primary-button"
          :onClick="() => submitForm()"
          :disabled="!submissionText"
          :loading="isLoadingQueryModel"
        />
        <MenuButton
          v-if="submissionStep === SubmissionStep.REPHRASE"
          :text="'Rephrase'"
          :onClick="() => submitForm()"
          className="primary-button"
          :disabled="!submissionText"
          :loading="isLoadingQueryModel"
        />
        <MenuButton
          v-if="
            isSubmissionValidated &&
            [SubmissionStep.VALIDATE, SubmissionStep.REPHRASE].includes(
              submissionStep
            )
          "
          text="Next"
          className="secondary-button"
          :onClick="() => handleNextClick()"
          :disabled="isLoadingChatMessage || isLoadingQueryModel"
        />
        <MenuButton
          v-if="submissionStep === SubmissionStep.SAVE"
          text="Save"
          className="secondary-button"
          :onClick="() => submitForm()"
          :disabled="
            !submissionText || !customer || isLoadingExtractCustomer
          "
          :loading="isLoadingSaveButton"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useUiStore } from "@/store/ui";
import { useChatStore } from "@/store/chat";
import SubmissionStep from "@/models/enums/SubmissionStep";
import ChatInputCustomerTextBox from "./ChatInputCustomerTextBox.vue";
import ChatInputSubmissionTextBox from "./ChatInputSubmissionTextBox.vue";

const props = defineProps(["submissionType"]);

// Configure state references
const uiStore = useUiStore();
const { scrollToBottom } = uiStore;
const chatStore = useChatStore(props.submissionType);
const {
  customer,
  hasActiveSession,
  isLoadingChatMessage,
  isLoadingExtractCustomer,
  isLoadingQueryModel,
  isLoadingSaveButton,
  isSubmissionValidated,
  submissionStep,
  submissionText,
} = storeToRefs(chatStore);
const { navigateToNextSubmissionStep, navigateToPrevSubmissionStep, queryModel, resetChatSession, saveSubmission } = chatStore;

async function submitForm() {
  submissionText.value = submissionText.value.trim();
  if (submissionStep.value === SubmissionStep.VALIDATE) {
    await queryModel(submissionText.value);
  } else if (submissionStep.value === SubmissionStep.REPHRASE) {
    await queryModel(submissionText.value);
  } else if (submissionStep.value === SubmissionStep.SAVE) {
    saveSubmission();
  }
}

async function handlePrevClick() {
  navigateToPrevSubmissionStep();
  scrollToBottom();
}

async function handleNextClick() {
  navigateToNextSubmissionStep();
  scrollToBottom();
}

onMounted(() => {
  scrollToBottom();
});
</script>
