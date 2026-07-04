<script setup lang="ts">
import { ref, watch } from 'vue';
import { useImageProcessing } from '../composables/useImageProcessing';
import { useZipExport } from '../composables/useZipExport';
import UploadStep from './uploader/UploadStep.vue';
import EditStep from './uploader/EditStep.vue';
import SuccessStep from './uploader/SuccessStep.vue';

const props = defineProps<{
  isDark: boolean
}>();

const viewStep = ref<'upload' | 'edit' | 'success'>('upload');

const {
  currentFile,
  currentImage,
  allBoxes,
  currentBoxes,
  minSize,
  isProcessing,
  resetImage,
  processSelectedFile,
  filterBoxesByMinSize
} = useImageProcessing();

const { isZipping, downloadZip } = useZipExport(currentFile, currentImage, currentBoxes);

const handleFileSelected = async (file: File) => {
  const success = await processSelectedFile(file);
  if (success) {
    viewStep.value = 'edit';
  }
};

const handleReset = () => {
  resetImage();
  viewStep.value = 'upload';
};

const handleDownload = () => {
  downloadZip(() => {
    viewStep.value = 'success';
  });
};

const goBackToEdit = () => {
  viewStep.value = 'edit';
};

const startNewCrop = () => {
  handleReset();
};

watch(minSize, () => {
  if (currentFile.value && viewStep.value === 'edit') {
    filterBoxesByMinSize();
  }
});
</script>

<template>
  <div class="uploader-container fade-in">
    <div class="uploader-header">
      <h1>Recorta de forma rapida y automatica.</h1>
      <p>Arrastra una plantilla con múltiples tarjetas, sprites o elementos. Los detectamos y separamos al instante.</p>
    </div>

    <UploadStep 
      v-show="viewStep === 'upload'" 
      :is-processing="isProcessing"
      @file-selected="handleFileSelected" 
    />

    <EditStep 
      v-show="viewStep === 'edit'"
      :current-file="currentFile"
      :current-image="currentImage"
      :all-boxes="allBoxes"
      v-model:current-boxes="currentBoxes"
      v-model:min-size="minSize"
      :is-processing="isProcessing"
      :is-zipping="isZipping"
      :is-dark="isDark"
      @reset="handleReset"
      @download="handleDownload"
    />

    <SuccessStep 
      v-if="viewStep === 'success'"
      @cancel="goBackToEdit"
      @new="startNewCrop"
    />
  </div>
</template>


<style scoped>
.uploader-container {
  max-width: 900px;
  width: 100%;
  margin: 0 auto;
  padding: 1rem 1.5rem 3rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.uploader-header {
  text-align: center;
  margin-bottom: 0.5rem;
}

.uploader-header h1 {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.uploader-header p {
  max-width: 600px;
  margin: 0 auto;
  color: var(--text-secondary);
}
</style>
