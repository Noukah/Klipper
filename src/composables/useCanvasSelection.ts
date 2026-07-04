import { ref, Ref } from 'vue';
import { BoundingBox, findComponentAt } from '../utils/imageProcessor';

export function useCanvasSelection(
  currentImage: Ref<HTMLImageElement | null>,
  allBoxes: Ref<BoundingBox[]>,
  currentBoxes: Ref<BoundingBox[]>,
  onUpdate: () => void
) {
  const isDraggingCanvas = ref(false);
  const dragStartX = ref(0);
  const dragStartY = ref(0);
  const dragCurrentX = ref(0);
  const dragCurrentY = ref(0);
  const dragMode = ref<'select' | 'deselect'>('select');

  const getCanvasImageCoords = (e: MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const imgX = Math.floor((e.clientX - rect.left) * (currentImage.value!.width / rect.width));
    const imgY = Math.floor((e.clientY - rect.top) * (currentImage.value!.height / rect.height));
    return { imgX, imgY };
  };

  const handleCanvasMouseDown = (e: MouseEvent, canvas: HTMLCanvasElement | null) => {
    if (!currentImage.value || !canvas) return;
    if (e.button !== 0) return; // Only left click
    
    const { imgX, imgY } = getCanvasImageCoords(e, canvas);
    
    dragStartX.value = imgX;
    dragStartY.value = imgY;
    dragCurrentX.value = imgX;
    dragCurrentY.value = imgY;
    isDraggingCanvas.value = true;

    // Determine mode
    const clickedExisting = currentBoxes.value.some(box => 
      imgX >= box.minX && imgX <= box.maxX && imgY >= box.minY && imgY <= box.maxY
    );
    
    dragMode.value = clickedExisting ? 'deselect' : 'select';
  };

  const handleCanvasMouseMove = (e: MouseEvent, canvas: HTMLCanvasElement | null) => {
    if (!isDraggingCanvas.value || !canvas) return;
    const { imgX, imgY } = getCanvasImageCoords(e, canvas);
    dragCurrentX.value = imgX;
    dragCurrentY.value = imgY;
  };

  const handleCanvasMouseUp = (e: MouseEvent, canvas: HTMLCanvasElement | null) => {
    if (!isDraggingCanvas.value || !canvas) return;
    isDraggingCanvas.value = false;
    
    const { imgX, imgY } = getCanvasImageCoords(e, canvas);
    dragCurrentX.value = imgX;
    dragCurrentY.value = imgY;

    const minX = Math.min(dragStartX.value, dragCurrentX.value);
    const maxX = Math.max(dragStartX.value, dragCurrentX.value);
    const minY = Math.min(dragStartY.value, dragCurrentY.value);
    const maxY = Math.max(dragStartY.value, dragCurrentY.value);

    // Check if click
    if (maxX - minX < 5 && maxY - minY < 5) {
      const existingBoxIndex = currentBoxes.value.findIndex(box => 
        imgX >= box.minX && imgX <= box.maxX && imgY >= box.minY && imgY <= box.maxY
      );
      
      if (existingBoxIndex !== -1) {
        currentBoxes.value.splice(existingBoxIndex, 1);
      } else {
        const newBox = findComponentAt(currentImage.value!, imgX, imgY);
        if (newBox) {
          currentBoxes.value.push(newBox);
        }
      }
    } else {
      // Selection area
      const intersect = (box: BoundingBox) => {
        return !(box.maxX < minX || box.minX > maxX || box.maxY < minY || box.minY > maxY);
      };

      if (dragMode.value === 'deselect') {
        currentBoxes.value = currentBoxes.value.filter(box => !intersect(box));
      } else {
        allBoxes.value.forEach(box => {
          if (intersect(box)) {
            const exists = currentBoxes.value.some(b => 
              b.minX === box.minX && b.maxX === box.maxX && b.minY === box.minY && b.maxY === box.maxY
            );
            if (!exists) currentBoxes.value.push(box);
          }
        });
      }
    }

    // Sort components reading-order
    currentBoxes.value.sort((a, b) => {
      if (Math.abs(a.minY - b.minY) < Math.min(a.maxY - a.minY, b.maxY - b.minY) / 2) {
        return a.minX - b.minX;
      }
      return a.minY - b.minY;
    });

    onUpdate();
  };

  const handleCanvasMouseLeave = () => {
    if (isDraggingCanvas.value) {
      isDraggingCanvas.value = false;
    }
  };

  return {
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
  };
}
