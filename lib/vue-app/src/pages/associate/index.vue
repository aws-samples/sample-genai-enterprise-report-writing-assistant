<template>
  <v-container fluid style="max-width: 1500px">
    <v-row>
      <v-col cols="12">
        <p class="page-title">What do you want to do today?</p>
      </v-col>
    </v-row>
    <v-spacer style="height: 30px" />
    <v-row>
      <v-col cols="12">
        <!-- <v-btn
          to="/associate/instructions"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Read Instructions"
        >
          Read Instructions
        </v-btn> -->
        <v-btn
          to="/associate/write-achievement"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Write Achievement"
        >
          Write Achievement
        </v-btn>
        <v-btn
          to="/associate/write-challenge"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Write Challenge"
        >
          Write Challenge
        </v-btn>
        <v-btn
          to="/associate/view-submissions"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="View Your Submissions"
        >
          View Your<br />Submissions
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
//
</script>
