<template>
  <SideNavigation title="Associate" titleLink="/associate" :links="links" />
</template>

<script setup lang="ts">
import { SubmissionType } from "@/models/enums/SubmissionType";
import { formatCategory } from "@/utils/string";

const links = [
  { title: "Your Submissions", to: "/associate/view-submissions" },
  {
    title: "Write Submission",
    group: Object.values(SubmissionType).map((submissionType) => (
      {
        title: `Write ${formatCategory(submissionType)}`,
        to: `/associate/write-${submissionType}`,
      }
    )),
  },
];
</script>
