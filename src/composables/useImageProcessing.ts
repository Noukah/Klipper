import { ref, shallowRef, watch } from 'vue';
import { processImage, BoundingBox } from '../utils/imageProcessor';

export function useImageProcessing() {
  const currentFile = shallowRef<File | null>(null);
  const currentImage = shallowRef<HTMLImageElement | null>(null);
  const allBoxes = ref<BoundingBox[]>([]);
  const currentBoxes = ref<BoundingBox[]>([]);
  
  const minSize = ref(50);
  const isProcessing = ref(false);

  const resetImage = () => {
    currentFile.value = null;
    currentImage.value = null;
    allBoxes.value = [];
    currentBoxes.value = [];
  };

  const filterBoxesByMinSize = () => {
    if (!allBoxes.value) return;
    currentBoxes.value = allBoxes.value.filter(box => {
      const w = box.maxX - box.minX + 1;
      const h = box.maxY - box.minY + 1;
      return w >= minSize.value && h >= minSize.value;
    });
  };

  const processSelectedFile = async (file: File): Promise<boolean> => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida.');
      return false;
    }
    
    isProcessing.value = true;
    currentFile.value = file;
    
    try {
      const { image, boxes } = await processImage(file);
      currentImage.value = image;
      allBoxes.value = boxes;
      filterBoxesByMinSize();
      return true;
    } catch (error) {
      console.error(error);
      alert('Hubo un error al procesar la imagen.');
      resetImage();
      return false;
    } finally {
      isProcessing.value = false;
    }
  };

  // Retornamos también filterBoxesByMinSize por si se necesita externamente, 
  // aunque internamente podemos manejar el watch si tenemos acceso al viewStep
  // pero viewStep pertenece al orquestador. 
  // Lo mejor es devolver las variables y funciones.

  return {
    currentFile,
    currentImage,
    allBoxes,
    currentBoxes,
    minSize,
    isProcessing,
    resetImage,
    processSelectedFile,
    filterBoxesByMinSize
  };
}
