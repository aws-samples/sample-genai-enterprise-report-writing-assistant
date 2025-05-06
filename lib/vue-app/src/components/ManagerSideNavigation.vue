<template>
  <SideNavigation title="Manager" titleLink="/manager" :links="links" />
</template>

<script setup lang="ts">
import { SubmissionType } from "@/models/enums/SubmissionType";
import { formatCategory } from "@/utils/string";

const links = Object.values(SubmissionType).map((submissionType) => ({
  title: `${formatCategory(submissionType)}s`,
  to: `/manager/view-${submissionType}s`,
}));

</script>
