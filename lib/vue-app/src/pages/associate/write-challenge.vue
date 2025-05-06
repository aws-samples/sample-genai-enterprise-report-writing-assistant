<template>
  <AssociateSideNavigation />
  <ChallengeHelpPanel />
  <v-container class="page-content" fluid>
    <ChatHeader :submissionType="SubmissionType.CHALLENGE" />
    <Chat :submissionType="SubmissionType.CHALLENGE" />
  </v-container>
</template>

<script setup lang="ts">
import { SubmissionType } from "@/models/enums/SubmissionType";
</script>
