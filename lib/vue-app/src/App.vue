<template>
  <v-app>
    <v-main>
      <authenticator :sign-up-attributes="['email', 'name']">
        <template  v-slot:default="{ signOut, user }">
          <router-view />
        </template>
      </authenticator>
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
 import { Authenticator } from '@aws-amplify/ui-vue'
</script>
