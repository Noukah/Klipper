<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { BoundingBox } from '../../utils/imageProcessor';
import { useCanvasSelection } from '../../composables/useCanvasSelection';

const props = defineProps<{
  currentImage: HTMLImageElement | null;
  allBoxes: BoundingBox[];
  currentBoxes: BoundingBox[];
  isDark: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:currentBoxes', boxes: BoundingBox[]): void
}>();

const previewCanvas = ref<HTMLCanvasElement | null>(null);

const currentImageRef = computed(() => props.currentImage);
const allBoxesRef = computed(() => props.allBoxes);

// local mutable copy
const localCurrentBoxes = ref<BoundingBox[]>(props.currentBoxes);

// Shallow watch props to update when parent filters
watch(() => props.currentBoxes, (newVal) => {
  if (newVal !== localCurrentBoxes.value) {
    localCurrentBoxes.value = newVal;
    drawPreview();
  }
});

const onBoxesUpdated = () => {
  // Emit a shallow copy so the parent knows it's a new array, triggering reactivity
  emit('update:currentBoxes', [...localCurrentBoxes.value]);
  drawPreview();
};

const {
  isDraggingCanvas,
  dragStartX,
  dragStartY,
  dragCurrentX,
  dragCurrentY,
  dragMode,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
  handleCanvasMouseLeave
} = useCanvasSelection(currentImageRef, allBoxesRef, localCurrentBoxes, onBoxesUpdated);

const drawPreview = () => {
  if (!previewCanvas.value || !props.currentImage) return;
  
  const canvas = previewCanvas.value;
  const ctx = canvas.getContext('2d');
  const image = props.currentImage;
  const boxes = localCurrentBoxes.value;
  if (!ctx) return;

  const maxWidth = 800;
  const scale = image.width > maxWidth ? maxWidth / image.width : 1;
  
  canvas.width = image.width * scale;
  canvas.height = image.height * scale;
  
  // Draw transparency grid background
  const gridBlock = 8;
  const gridColor1 = props.isDark ? '#231f2c' : '#f9f9fb';
  const gridColor2 = props.isDark ? '#1a1722' : '#eeeeee';
  
  for (let x = 0; x < canvas.width; x += gridBlock) {
    for (let y = 0; y < canvas.height; y += gridBlock) {
      ctx.fillStyle = ((x / gridBlock + y / gridBlock) % 2 === 0) ? gridColor1 : gridColor2;
      ctx.fillRect(x, y, gridBlock, gridBlock);
    }
  }
  
  // Draw image
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  
  // Draw bounding boxes
  ctx.lineWidth = 3.0; // Thicker lines for dominant view
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Neon High-Visibility Colors
  const strokeColor = '#00ff33'; // Bright neon green
  const fillColor = 'rgba(0, 255, 51, 0.18)'; // Semi-transparent green fill
  const labelColor = '#00ff33'; // Matching green text
  const labelBg = 'rgba(0, 0, 0, 0.85)'; // Dark contrast background
  const labelBorder = '#00ff33'; // Matching green border
  
  boxes.forEach((box, index) => {
    const x = box.minX * scale;
    const y = box.minY * scale;
    const w = (box.maxX - box.minX + 1) * scale;
    const h = (box.maxY - box.minY + 1) * scale;
    
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = fillColor;
    ctx.strokeRect(x, y, w, h);
    ctx.fillRect(x, y, w, h);
    
    // Draw pill badge for ID
    const text = `${index + 1}`;
    ctx.font = 'bold 11px "Plus Jakarta Sans", system-ui, sans-serif';
    const textWidth = ctx.measureText(text).width;
    const paddingX = 6;
    const badgeW = textWidth + paddingX * 2;
    const badgeH = 18;
    const badgeX = x + 5;
    const badgeY = y + 5;
    
    ctx.fillStyle = labelBg;
    ctx.strokeStyle = labelBorder;
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH);
    }
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, badgeX + badgeW / 2, badgeY + badgeH / 2);
  });

  // Draw drag selection box if active
  if (isDraggingCanvas.value) {
    const minX = Math.min(dragStartX.value, dragCurrentX.value) * scale;
    const minY = Math.min(dragStartY.value, dragCurrentY.value) * scale;
    const w = Math.abs(dragCurrentX.value - dragStartX.value) * scale;
    const h = Math.abs(dragCurrentY.value - dragStartY.value) * scale;

    ctx.lineWidth = 2.5;
    if (dragMode.value === 'select') {
      ctx.strokeStyle = '#00e5ff'; // Bright neon cyan
      ctx.fillStyle = 'rgba(0, 229, 255, 0.18)';
    } else {
      ctx.strokeStyle = '#ff0055'; // Bright neon pink-red
      ctx.fillStyle = 'rgba(255, 0, 85, 0.18)';
    }
    
    ctx.strokeRect(minX, minY, w, h);
    ctx.fillRect(minX, minY, w, h);
  }
};

watch([isDraggingCanvas, dragCurrentX, dragCurrentY, () => props.isDark, () => props.currentImage], () => {
  nextTick(() => drawPreview());
});
</script>

<template>
  <div class="canvas-wrapper">
    <canvas 
      ref="previewCanvas" 
      @mousedown="e => handleCanvasMouseDown(e, previewCanvas)"
      @mousemove="e => handleCanvasMouseMove(e, previewCanvas)"
      @mouseup="e => handleCanvasMouseUp(e, previewCanvas)"
      @mouseleave="handleCanvasMouseLeave"
    >
    </canvas>
  </div>
</template>

<style scoped>
.canvas-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  overflow: auto;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  background: var(--bg-app);
  padding: 10px;
}

canvas {
  border-radius: 4px;
  box-shadow: var(--shadow-sm);
  cursor: crosshair;
  max-width: 100%;
  display: block;
}
</style>
