import { Ref, ref } from 'vue';
import { BoundingBox, createZipFromCrops } from '../utils/imageProcessor';

export function useZipExport(
  currentFile: Ref<File | null>,
  currentImage: Ref<HTMLImageElement | null>,
  currentBoxes: Ref<BoundingBox[]>
) {
  const isZipping = ref(false);

  const downloadZip = async (onSuccess: () => void) => {
    if (!currentImage.value || currentBoxes.value.length === 0) return;
    
    isZipping.value = true;
    try {
      const blob = await createZipFromCrops(currentImage.value, currentBoxes.value);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentFile.value?.name.split('.')[0] || 'recortes'}_cortes.zip`;
      document.body.appendChild(a);
      a.click();
      
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Simulate slight delay for the UI, then trigger success callback
      setTimeout(() => {
        isZipping.value = false;
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error(error);
      alert('Error al generar el ZIP.');
      isZipping.value = false;
    }
  };

  return {
    isZipping,
    downloadZip
  };
}
