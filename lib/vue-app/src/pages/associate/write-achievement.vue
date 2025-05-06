<template>
  <AssociateSideNavigation />
  <AchievementHelpPanel />
  <v-container class="page-content" fluid>
    <ChatHeader :submissionType="SubmissionType.ACHIEVEMENT" />
    <Chat :submissionType="SubmissionType.ACHIEVEMENT" />
  </v-container>
</template>

<script setup lang="ts">
import { SubmissionType } from "@/models/enums/SubmissionType";
</script>
