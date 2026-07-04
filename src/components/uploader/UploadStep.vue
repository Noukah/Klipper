<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  isProcessing?: boolean
}>();

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>();

const isDragging = ref(false);

const handleDragOver = (e: DragEvent) => {
  e.preventDefault();
  if (props.isProcessing) return;
  isDragging.value = true;
};

const handleDragLeave = (e: DragEvent) => {
  e.preventDefault();
  if (props.isProcessing) return;
  isDragging.value = false;
};

const handleDrop = (e: DragEvent) => {
  e.preventDefault();
  if (props.isProcessing) return;
  isDragging.value = false;
  
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    emit('file-selected', e.dataTransfer.files[0]);
  }
};

const handleFileSelect = (e: Event) => {
  if (props.isProcessing) return;
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    emit('file-selected', target.files[0]);
  }
};
</script>

<template>
  <label 
    class="drop-zone glass-panel"
    :class="{ 'dragging': isDragging, 'is-processing': isProcessing }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
    for="file-upload"
  >
    <div class="drop-content">
      <div class="drop-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
      </div>
      <p class="drop-text-primary">Arrastra tu imagen PNG o JPG aquí</p>
      <p class="drop-text-secondary">o haz clic para explorar tus carpetas</p>
      <input type="file" accept="image/png, image/jpeg" id="file-upload" @change="handleFileSelect" :disabled="isProcessing" />
      <span class="btn-primary select-btn" :class="{ 'is-loading': isProcessing }">
        <svg v-if="isProcessing" class="spinner" viewBox="0 0 24 24">
          <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
        </svg>
        <span>{{ isProcessing ? 'Cargando...' : 'Seleccionar archivo' }}</span>
      </span>
    </div>
  </label>
</template>

<style scoped>
/* Drop Zone Styles */
.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  cursor: pointer;
  background: var(--bg-card);
  transition: var(--transition-smooth);
}

.drop-zone:hover {
  border-color: var(--accent-primary);
  background: rgba(167, 139, 250, 0.03);
}

.drop-zone.dragging {
  border-color: var(--accent-primary);
  background: rgba(167, 139, 250, 0.08);
  transform: scale(1.01);
}

.drop-zone.is-processing {
  opacity: 0.7;
  pointer-events: none;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.drop-icon {
  width: 56px;
  height: 56px;
  color: var(--accent-primary);
  background: var(--bg-app);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.2rem;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-smooth);
}

.drop-zone:hover .drop-icon {
  transform: translateY(-4px);
  color: var(--accent-secondary);
  box-shadow: var(--shadow-md);
}

.drop-icon svg {
  width: 26px;
  height: 26px;
}

.drop-text-primary {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1.1rem;
  margin-bottom: 0.2rem;
}

.drop-text-secondary {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
}

input[type="file"] {
  display: none;
}

.select-btn {
  margin-top: 0.2rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

/* Spinner */
.spinner {
  animation: rotate 2s linear infinite;
  width: 18px;
  height: 18px;
}

.spinner .path {
  stroke: currentColor;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}
</style>
