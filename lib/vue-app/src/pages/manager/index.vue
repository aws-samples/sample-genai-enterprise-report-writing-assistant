<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="text-center">
        <p class="page-title">What do you want to do today?</p>
      </v-col>
    </v-row>
    <v-spacer style="height: 30px" />
    <v-row>
      <v-col cols="12">
        <!-- <v-btn
          to="/manager/instructions"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Read Instructions"
        >
          Read Instructions
        </v-btn> -->
        <v-btn
          to="/manager/view-achievements"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="View Achievement Submissions"
        >
          View Achievement Submissions
        </v-btn>
        <v-btn
          to="/manager/view-challenges"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="View Challenge Submissions"
        >
          View Challenge Submissions
        </v-btn>
      </v-col>
      <v-col cols="4"></v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
//
</script>
