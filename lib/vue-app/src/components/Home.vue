<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12" class="text-center">
        <p class="page-title">Select your role:</p>
      </v-col>
    </v-row>
    <v-spacer style="height: 30px" />
    <v-row>
      <v-col cols="12">
        <v-btn
          to="/associate"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Associate"
        >
          Associate
        </v-btn>
        <v-btn
          to="/manager"
          class="text-none mb-4 menu-button"
          size="large"
          rounded="lg"
          block
          aria-label="Manager"
        >
          Manager
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
//
</script>
