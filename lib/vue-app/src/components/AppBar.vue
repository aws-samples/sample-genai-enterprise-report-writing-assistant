<template>
  <v-app-bar flat app style="position: fixed">
    <v-app-bar-title>
      <button
        class="app-bar-title"
        @click="router.push('/')"
        aria-label="Writing Assistant"
        style="margin-left: 25px;"
      >
        Writing Assistant
      </button>
      <span style="padding-left: 25px">
        <v-btn to="/associate" rounded="lg" aria-label="Associate">
          Associate
        </v-btn>
        <v-btn to="/manager" rounded="lg" aria-label="Manager">Manager</v-btn>
      </span>
    </v-app-bar-title>

    <v-spacer></v-spacer>
    <div class="d-flex align-center">
      <span class="mr-4">{{ username }}</span>
      <v-btn 
        rounded="lg" 
        variant="text" 
        @click="handleSignOut"
        aria-label="Sign Out"
      >
        Sign Out
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script lang="ts" setup>
import { useRouter } from "vue-router";
import { ref, onMounted } from 'vue';
import { fetchUserAttributes, signOut } from 'aws-amplify/auth';

const router = useRouter();
const username = ref('');

onMounted(async () => {
  try {
    const { name } = await fetchUserAttributes();
    username.value = name as string;
    console.log('User:', username.value);
  } catch (error) {
    console.error('Error getting user:', error);
  }
});

const handleSignOut = async () => {
  try {
    await signOut();
    router.push('/');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};
</script>
