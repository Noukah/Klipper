<script setup lang="ts">
import { ref, computed } from 'vue'
import ImageUploader from './components/ImageUploader.vue'
import SettingsModal from './components/SettingsModal.vue'
import { useSettings } from './composables/useSettings'

const { settings, saveSettings } = useSettings()

const isSettingsOpen = ref(false)

const handleSaveSettings = (newSettings: any) => {
  saveSettings(newSettings)
  isSettingsOpen.value = false
}

// Pass isDark to ImageUploader for its specific internal logic (if it still needs it)
const isDark = computed(() => settings.value.isDarkMode)
</script>

<template>
  <div class="app-layout">
    <header class="app-header fade-in">
      <div class="header-logo">
        <div class="logo-icon">✨</div>
        <span class="logo-text">Klipper</span>
      </div>
      
      <button class="user-profile-btn" @click="isSettingsOpen = true" aria-label="Abrir configuración">
        <div class="profile-avatar">
          <img v-if="settings.profile.photoUrl" :src="settings.profile.photoUrl" alt="Avatar" />
          <div v-else class="avatar-placeholder">
            {{ settings.profile.name ? settings.profile.name.charAt(0).toUpperCase() : '?' }}
          </div>
        </div>
        <span class="profile-name">{{ settings.profile.name || 'Invitado' }}</span>
      </button>
    </header>

    <main class="app-content">
      <ImageUploader :is-dark="isDark" />
    </main>

    <SettingsModal 
      :is-open="isSettingsOpen"
      :user-profile="settings.profile"
      :custom-themes="settings.customThemes"
      :current-theme-id="settings.currentThemeId"
      :is-dark-mode="settings.isDarkMode"
      @close="isSettingsOpen = false"
      @cancel="isSettingsOpen = false"
      @save="handleSaveSettings"
    />
  </div>
</template>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.logo-icon {
  font-size: 1.5rem;
  animation: float 3s ease-in-out infinite;
}

.logo-text {
  font-family: var(--font-sans);
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: -0.02em;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* User Profile Button */
.user-profile-btn {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 99px;
  padding: 6px 16px 6px 6px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: var(--transition-smooth);
  box-shadow: var(--shadow-sm);
  outline: none;
}

.user-profile-btn:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--bg-app);
  box-shadow: 0 0 0 1px var(--accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-glow);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  color: var(--accent-primary);
  font-weight: bold;
  font-size: 0.9rem;
}

.profile-name {
  font-family: var(--font-sans);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.app-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
