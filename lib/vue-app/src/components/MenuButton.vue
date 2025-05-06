<template>
  <v-menu v-if="props.menuItems && props.menuItems.length > 0" offset-y>
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        :class="className"
        :rounded="rounded"
        :disabled="disabled"
        :loading="loading"
        :style="getButtonStyle"
        :append-icon="isMenuOpen ? `mdi-triangle-small-up` : `mdi-triangle-small-down`"
        :to="to"
        @click="handleClick"
        :on-group:selected="() => console.log(1)"
        flat
      >
        {{ text }}
      </v-btn>
    </template>
    <v-list class="form-input">
      <v-list-item v-for="(item, index) in menuItems" :key="index" :to="item.to" @click="item.onClick">
        {{ item.text }}
      </v-list-item>
    </v-list>
  </v-menu>
  <v-btn
    v-else
    :class="className"
    :rounded="rounded"
    :disabled="disabled"
    :append-icon="appendIcon"
    :to="to"
    :onclick="handleClick"
    :style="getButtonStyle"
    flat
  >
    {{ text }}
    <template v-slot:prepend v-if="loading">
      <span style="margin-left: 5px">
        <v-progress-circular
          indeterminate
          :color="getProgressSpinnerColor"
          size="x-small"
          width="2"
        ></v-progress-circular>
      </span>
    </template>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, PropType, ref } from "vue";

const isMenuOpen = ref(false);

interface MenuItem {
  text: string;
  onClick?: () => void;
  to?: string;
}

const props = defineProps({
  text: { type: String, required: true },
  to: { type: String, required: false },
  onClick: { type: Function, required: false },
  menuItems: { type: Array as PropType<MenuItem[]>, required: false },
  className: { type: String, required: false },
  disabled: { type: Boolean, required: false, default: false },
  loading: { type: Boolean, required: false, default: false },
  rounded: { type: String, required: false, default: "pill" },
  float: { type: String, required: false },
  appendIcon: { type: String, required: false },
});

const getButtonStyle = computed(() => {
  let styles = "margin-left: 5px; margin-right: 5px; ";
  styles +=  props.loading ? "cursor: default;" : "cursor: pointer;";
  if (props.float) {
    styles += ` float: ${props.float};`;
  }
  return styles;
});

const getProgressSpinnerColor = computed(() => {
  if (props.className?.includes("primary-button")) {
    return "#ffffff";
  }
  else if (props.className?.includes("secondary-button")) {
    return "#000000";
  }
  else {
    return "#2074d5";
  }

});

const handleClick = () => {
  if (props.menuItems) {
    isMenuOpen.value = !isMenuOpen.value;
  }
  else if (!props.loading && props.onClick) {
    props.onClick();
  }
}
</script>
