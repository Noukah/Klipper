<script setup lang="ts">
import { ref, watch } from 'vue';
import { useSettings, Theme, UserProfile } from '../composables/useSettings';

const props = defineProps<{
  isOpen: boolean;
  userProfile: UserProfile;
  customThemes: Theme[];
  currentThemeId: string;
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'save', settings: { profile: UserProfile, customThemes: Theme[], currentThemeId: string, isDarkMode: boolean }): void;
  (e: 'cancel'): void;
}>();

const { previewDarkMode, applyThemeVariables } = useSettings();

// Local state
const tempProfile = ref<UserProfile>({ name: '', photoUrl: '' });
const localCustomThemes = ref<Theme[]>([]);
const localCurrentThemeId = ref('');
const localIsDarkMode = ref(false);

const newThemeLink = ref('');
const themeError = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

const defaultTheme: Theme = {
  id: 'default',
  colors: ['#f5f4f8', '#ffffff', '#a78bfa', '#ec4899']
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    tempProfile.value = { ...props.userProfile };
    localCustomThemes.value = [...props.customThemes];
    localCurrentThemeId.value = props.currentThemeId;
    localIsDarkMode.value = props.isDarkMode;
    newThemeLink.value = '';
    themeError.value = '';
  }
});

// Real-time preview for Dark Mode
watch(localIsDarkMode, (newVal) => {
  if (props.isOpen) {
    previewDarkMode(newVal);
  }
});

// Real-time preview for Themes
watch(localCurrentThemeId, (newVal) => {
  if (props.isOpen) {
    applyThemeVariables(newVal, localCustomThemes.value);
  }
});

function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    alert("El archivo supera el límite de 5 MB.");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    tempProfile.value.photoUrl = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function handleSelectTheme(theme: Theme) {
  localCurrentThemeId.value = theme.id;
}

function handleDeleteTheme(themeId: string) {
  localCustomThemes.value = localCustomThemes.value.filter((t: Theme) => t.id !== themeId);
  if (localCurrentThemeId.value === themeId) {
    localCurrentThemeId.value = 'default';
  }
}

const isLimitMessageActive = ref(false);
let limitMessageTimeout: ReturnType<typeof setTimeout> | null = null;

function triggerLimitMessage() {
  if (limitMessageTimeout) {
    clearTimeout(limitMessageTimeout);
  }
  isLimitMessageActive.value = true;
  limitMessageTimeout = setTimeout(() => {
    isLimitMessageActive.value = false;
  }, 2000);
}

function handleAddTheme() {
  themeError.value = '';
  if (localCustomThemes.value.length >= 5) {
    triggerLimitMessage();
    return;
  }
  const link = newThemeLink.value.trim();
  if (!link) return;
  const match = link.match(/([a-fA-F0-9]{24})$/);
  if (!match) {
    themeError.value = 'Enlace de Colorhunt inválido.';
    return;
  }
  const hexString = match[1];
  const colors = [
    '#' + hexString.substring(0, 6),
    '#' + hexString.substring(6, 12),
    '#' + hexString.substring(12, 18),
    '#' + hexString.substring(18, 24)
  ];
  const newTheme: Theme = { id: Date.now().toString(), colors };
  localCustomThemes.value.push(newTheme);
  newThemeLink.value = '';
  handleSelectTheme(newTheme);
}

function handleSave() {
  emit('save', {
    profile: { ...tempProfile.value },
    customThemes: [...localCustomThemes.value],
    currentThemeId: localCurrentThemeId.value,
    isDarkMode: localIsDarkMode.value
  });
}

function handleClose() {
  // Auto-save when clicking outside or clicking the X button
  handleSave();
}

function handleCancel() {
  // Revert preview back to actual saved settings if user explicitly cancels
  previewDarkMode(props.isDarkMode);
  applyThemeVariables(props.currentThemeId, props.customThemes);
  emit('cancel');
}
</script>

<template>
  <div v-if="isOpen" class="modal-overlay fade-in" @click.self="handleClose">
    <div class="modal-content glass-panel">
      
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="header-icon-container">
            ✨
          </div>
          <div class="header-text">
            <h2>Configuración</h2>
            <p>Personaliza tu perfil y diseño de Klipper.</p>
          </div>
        </div>
        <button @click="handleClose" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        
        <!-- Nombre visible -->
        <div class="form-group">
          <label>Nombre visible</label>
          <input type="text" v-model="tempProfile.name" class="settings-input" placeholder="Tu nombre..." />
        </div>

        <!-- Foto de perfil -->
        <div class="form-group">
          <label>Foto de perfil</label>
          <div class="upload-row">
            <div class="avatar-preview-container">
              <img v-if="tempProfile.photoUrl" :src="tempProfile.photoUrl" class="settings-avatar-preview" />
              <div v-else class="settings-avatar-placeholder">
                {{ tempProfile.name ? tempProfile.name.charAt(0).toUpperCase() : '?' }}
              </div>
            </div>
            
            <div class="dashed-upload-area" @click="triggerFileInput">
              <input type="file" ref="fileInput" accept="image/*" @change="handleFileUpload" style="display: none;" />
              <span class="upload-title">Haz clic para subir imagen</span>
              <span class="upload-subtitle">JPG/PNG. Máx. 5 MB</span>
            </div>
          </div>
          
          <div class="settings-separator">
            <span>o pegar un enlace web</span>
          </div>
          <input type="text" v-model="tempProfile.photoUrl" class="settings-input" placeholder="Ej: https://imgur.com/foto.png" />
        </div>

        <!-- Themes Section -->
        <div class="form-group themes-section">
          
          <div class="theme-mode-selector">
            <div 
              class="mode-option" 
              :class="{ 'active': !localIsDarkMode }" 
              @click="localIsDarkMode = false"
            >
              <svg class="mode-icon sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
              <span>Claro</span>
            </div>
            <div 
              class="mode-option" 
              :class="{ 'active': localIsDarkMode }" 
              @click="localIsDarkMode = true"
            >
              <svg class="mode-icon moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>Oscuro</span>
            </div>
          </div>

          <div class="themes-header" style="margin-top: 1rem;">
            <label>Temas (Colorhunt)</label>
          </div>
          
          <div class="themes-inner-card">
            <div class="themes-col-left">
              <div class="input-with-add">
                <input type="text" v-model="newThemeLink" class="settings-input" placeholder="Ej: https://colorhunt.co/palette/..." @keyup.enter="handleAddTheme" />
                <button @click="handleAddTheme" class="btn-add" :disabled="localCustomThemes.length >= 5">
                  <span v-if="isLimitMessageActive" class="limit-msg">Límite</span>
                  <span v-else>+</span>
                </button>
              </div>
              <span v-if="themeError" class="theme-error-text">{{ themeError }}</span>
            </div>

            <div class="themes-col-right">
              <div class="themes-scroller">
                <!-- Default theme -->
                <div class="settings-theme-row" :class="{ 'row-active': localCurrentThemeId === 'default' }" @click="handleSelectTheme(defaultTheme)">
                  <div class="theme-color-blocks">
                    <span v-for="c in defaultTheme.colors" :key="c" :style="{ background: c }"></span>
                  </div>
                  <span class="theme-row-name">Predeterminado</span>
                </div>

                <!-- Custom themes -->
                <div 
                  v-for="theme in localCustomThemes" 
                  :key="theme.id" 
                  class="settings-theme-row" 
                  :class="{ 'row-active': localCurrentThemeId === theme.id }"
                  @click="handleSelectTheme(theme)"
                >
                  <div class="theme-color-blocks">
                    <span v-for="c in theme.colors" :key="c" :style="{ background: c }"></span>
                  </div>
                  <span class="theme-row-name">Tema Custom</span>
                  <button @click.stop="handleDeleteTheme(theme.id)" class="btn-theme-delete" title="Eliminar tema">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button @click="handleCancel" class="btn-secondary-cancel">Cancelar</button>
      </div>
      
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-container {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-glow);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
}

.header-text h2 {
  font-size: 1.25rem;
  margin: 0 0 4px 0;
  color: var(--text-primary);
}

.header-text p {
  font-size: 0.85rem;
  margin: 0;
  color: var(--text-secondary);
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  transition: var(--transition-fast);
}

.close-btn:hover {
  background: var(--bg-app);
  color: var(--danger);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.settings-input {
  width: 100%;
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  color: var(--text-primary);
  font-family: var(--font-sans);
  outline: none;
  transition: var(--transition-fast);
}

.settings-input:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 2px var(--accent-glow);
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.avatar-preview-container {
  flex-shrink: 0;
}

.settings-avatar-preview {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent-primary);
}

.settings-avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--accent-glow);
  color: var(--accent-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid var(--accent-primary);
}

.dashed-upload-area {
  flex-grow: 1;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg-app);
  cursor: pointer;
  transition: var(--transition-fast);
}

.dashed-upload-area:hover {
  border-color: var(--accent-primary);
  background: var(--accent-glow);
}

.upload-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-subtitle {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.settings-separator {
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  margin: 4px 0;
}

.settings-separator::before,
.settings-separator::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid var(--border-color);
}

.settings-separator span {
  padding: 0 12px;
}

.themes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Theme Mode Selector (Claro/Oscuro) */
.theme-mode-selector {
  display: flex;
  gap: 12px;
  background: var(--bg-app);
  padding: 6px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
}

.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.95rem;
  transition: var(--transition-fast);
  border: 2px solid transparent;
}

.mode-option:hover {
  background: var(--bg-card);
}

.mode-option.active {
  background: var(--bg-card);
  color: var(--accent-primary);
  border-color: var(--accent-glow);
  box-shadow: 0 4px 12px var(--accent-glow);
}

.mode-icon {
  width: 20px;
  height: 20px;
}

.themes-inner-card {
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-app);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.themes-col-left {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.input-with-add {
  display: flex;
  gap: 8px;
}

.btn-add {
  background: var(--accent-primary);
  color: var(--accent-text, white);
  border: none;
  border-radius: var(--radius-md);
  padding: 0 16px;
  font-weight: bold;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-add:disabled {
  background: var(--border-color);
  cursor: not-allowed;
}

.btn-add:not(:disabled):hover {
  background: var(--accent-secondary);
}

.limit-msg {
  font-size: 0.75rem;
}

.theme-error-text {
  color: var(--danger);
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

.themes-col-right {
  padding: 1rem;
}

.themes-scroller {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.settings-theme-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: var(--bg-card);
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-fast);
}

.settings-theme-row:hover {
  border-color: var(--border-color);
}

.settings-theme-row.row-active {
  border-color: var(--accent-primary);
  box-shadow: 0 2px 8px var(--accent-glow);
}

.theme-color-blocks {
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.theme-color-blocks span {
  width: 16px;
  height: 16px;
  display: inline-block;
}

.theme-row-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.btn-theme-delete {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0 4px;
}

.btn-theme-delete:hover {
  color: var(--danger);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-secondary-cancel {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-secondary-cancel:hover {
  background: var(--bg-app);
}
</style>
