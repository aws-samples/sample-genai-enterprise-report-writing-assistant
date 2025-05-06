<template>
  <v-row>
    <v-col>
      <v-text-field
        v-model="customer"
        ref="customerInput"
        class="text-input customer-text-input"
        :label="customer ? 'Customer Name' : ''"
        placeholder="Enter the customer name"
        required
        variant="outlined"
        rounded="lg"
        :loading="isLoading"
        :disabled="disabled"
        autocomplete="off"
        hide-details
        :clearable="false"
        no-resize
        @keydown.enter.exact.prevent="handleSubmit"
      >
        <template v-slot:append-inner>
          <v-icon
            icon="mdi-file-search-outline"
            size="default"
            color="#2074d5"
            variant="plain"
            :disabled="disabled"
            @click="handleSubmit"
            label="Extract customer name"
            title="Extract customer name"
            aria-label="Extract customer name"
          />
        </template>
      </v-text-field>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useChatStore } from "@/store/chat";

const props = defineProps({
  submissionType: { type: String, required: true },
  isLoading: { type: Boolean, required: true },
  disabled: { type: Boolean, required: true },
});

const chatStore = useChatStore(props.submissionType);
const { customer } = storeToRefs(chatStore);

const handleSubmit = () => {
  chatStore.extractCustomerName();
};
</script>
