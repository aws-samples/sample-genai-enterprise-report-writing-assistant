<template>
  <ManagerSideNavigation />
  <v-container fluid class="page-content">
    <ManagerViewTable :category="SubmissionType.CHALLENGE" />
  </v-container>
</template>

<script setup lang="ts">
import { SubmissionType } from "@/models/enums/SubmissionType";
</script>
