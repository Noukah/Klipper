<script setup lang="ts">
import { computed } from 'vue';
import { BoundingBox } from '../../utils/imageProcessor';
import CanvasPreview from './CanvasPreview.vue';

const props = defineProps<{
  currentFile: File | null;
  currentImage: HTMLImageElement | null;
  allBoxes: BoundingBox[];
  currentBoxes: BoundingBox[];
  minSize: number;
  isProcessing: boolean;
  isZipping: boolean;
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:minSize', value: number): void;
  (e: 'update:currentBoxes', boxes: BoundingBox[]): void;
  (e: 'reset'): void;
  (e: 'download'): void;
}>();

const minSizeComputed = computed({
  get: () => props.minSize,
  set: (val: number) => emit('update:minSize', val)
});

const currentBoxesComputed = computed({
  get: () => props.currentBoxes,
  set: (val: BoundingBox[]) => emit('update:currentBoxes', val)
});
</script>

<template>
  <div class="edit-step-container">
    <div class="drop-zone glass-panel has-file">
      <div class="file-loaded-content">
        <div class="file-info">
          <div class="file-icon">🖼️</div>
          <div class="file-details">
            <p class="file-name">{{ currentFile?.name }}</p>
            <p class="file-size">{{ currentFile ? (currentFile.size / 1024).toFixed(1) : '' }} KB</p>
          </div>
          <button class="btn-clear" @click="$emit('reset')" aria-label="Eliminar imagen">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Active Controls -->
    <div class="controls-panel glass-panel">
      <div class="control-group">
        <div class="slider-header">
          <label for="noise-filter">Filtro de Ruido (Tamaño mínimo)</label>
          <span class="badge">{{ minSizeComputed }}px</span>
        </div>
        <input 
          type="range" 
          id="noise-filter" 
          v-model.number="minSizeComputed" 
          min="10" 
          max="200" 
          step="5" 
          :style="{ background: `linear-gradient(to right, var(--accent-primary) ${(minSizeComputed - 10) / 190 * 100}%, var(--border-color) ${(minSizeComputed - 10) / 190 * 100}%)` }"
        />
        <span class="control-hint">Ignora automáticamente las formas más pequeñas que este tamaño.</span>
      </div>

      <div class="control-divider"></div>
      
      <div class="stats-group">
        <div class="stat-item">
          <span class="stat-val">{{ currentBoxesComputed.length }}</span>
          <span class="stat-lbl">tarjetas encontradas</span>
        </div>
        
        <button class="btn-primary download-btn" @click="$emit('download')" :disabled="isZipping || currentBoxesComputed.length === 0">
          <svg v-if="isZipping" class="spinner" viewBox="0 0 24 24">
            <circle class="path" cx="12" cy="12" r="10" fill="none" stroke-width="3"></circle>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
            <polyline points="8 17 12 21 16 17"></polyline>
            <line x1="12" y1="12" x2="12" y2="21"></line>
            <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"></path>
          </svg>
          <span>{{ isZipping ? 'Comprimiendo...' : 'Descargar ZIP' }}</span>
        </button>
      </div>
    </div>

    <!-- Canvas Preview Section -->
    <div class="preview-panel glass-panel">
      <div class="preview-header">
        <h3>Vista previa interactiva</h3>
        <p>Arrastra sobre el lienzo para seleccionar/deseleccionar múltiples cajas o haz clic en una para alternarla individualmente.</p>
      </div>
      
      <CanvasPreview 
        :current-image="currentImage"
        :all-boxes="allBoxes"
        v-model:current-boxes="currentBoxesComputed"
        :is-dark="isDark"
      />
    </div>
  </div>
</template>

<style scoped>
.edit-step-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
}

/* File Loaded Panel - using drop-zone classes for consistency */
.drop-zone.has-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  padding: 1.5rem;
  cursor: default;
}

.file-loaded-content {
  width: 100%;
}

.file-info {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 1rem;
  padding: 0.5rem 1rem;
}

.file-icon {
  font-size: 2rem;
}

.file-details {
  flex-grow: 1;
  text-align: left;
}

.file-name {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 1rem;
  word-break: break-all;
}

.file-size {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.btn-clear {
  background: var(--bg-app);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition-fast);
}

.btn-clear:hover {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger-text);
  transform: scale(1.05);
}

.btn-clear svg {
  width: 16px;
  height: 16px;
}

/* Controls Panel */
.controls-panel {
  display: flex;
  padding: 1.8rem;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.control-group {
  flex: 1;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.slider-header label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--text-primary);
}

.badge {
  background: var(--accent-glow);
  color: var(--accent-primary);
  border: 1px solid rgba(167, 139, 250, 0.2);
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.85rem;
  font-weight: 700;
}

.control-hint {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 4px;
}

/* Styled Range Input */
input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  border-radius: 99px;
  background: var(--border-color);
  outline: none;
  transition: var(--transition-fast);
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent-primary);
  cursor: pointer;
  transition: transform 0.1s ease, background-color 0.2s ease;
  box-shadow: 0 4px 12px var(--accent-glow), 0 0 0 2px var(--bg-app);
  border: 0px solid var(--bg-card-solid);
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.10);
  background: var(--accent-secondary);
  box-shadow: 0 6px 16px var(--accent-glow), 0 0 0 2px var(--bg-app);
}

.control-divider {
  width: 1px;
  height: 60px;
  background: var(--border-color);
}

.stats-group {
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-shrink: 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.stat-val {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.stat-lbl {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.download-btn {
  height: 48px;
  padding: 0 1.5rem;
}

.btn-icon {
  width: 18px;
  height: 18px;
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

/* Preview Panel */
.preview-panel {
  padding: 1.8rem;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.preview-header h3 {
  font-size: 1.2rem;
  margin-bottom: 0.2rem;
}

@media (max-width: 768px) {
  .controls-panel {
    flex-direction: column;
    align-items: stretch;
  }
  
  .control-divider {
    width: 100%;
    height: 1px;
  }
  
  .stats-group {
    justify-content: space-between;
  }
}
</style>
