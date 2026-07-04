<script setup lang="ts">
defineEmits<{
  (e: 'cancel'): void
  (e: 'new'): void
}>();
</script>

<template>
  <div class="success-panel glass-panel fade-in">
    <div class="success-content">
      <div class="success-animation">
        <svg class="checkmark-circle" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
          <circle class="checkmark-circle-bg" cx="26" cy="26" r="25" fill="none"/>
          <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
        </svg>
      </div>
      <h2 class="success-title">¡Descarga Completada!</h2>
      <p class="success-text">Tus imágenes han sido recortadas y guardadas exitosamente en un archivo ZIP.</p>
      
      <div class="success-actions">
        <button class="btn-secondary" @click="$emit('cancel')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Regresar (Volver a editar)
        </button>
        <button class="btn-primary" @click="$emit('new')">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo recorte
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Success Panel Styles */
.success-panel {
  padding: 4rem 2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin-top: 2rem;
}

.success-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 500px;
}

.success-animation {
  width: 100px;
  height: 100px;
  margin-bottom: 2rem;
}

.checkmark-circle {
  width: 100px;
  height: 100px;
  stroke: var(--success);
  stroke-width: 3;
  stroke-miterlimit: 10;
}

.checkmark-circle-bg {
  stroke: var(--success-border);
  stroke-width: 2;
  animation: scale-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.3s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes scale-up {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.success-title {
  font-size: 2rem;
  color: var(--success-text);
  margin-bottom: 1rem;
}

.success-text {
  color: var(--text-secondary);
  margin-bottom: 2.5rem;
  font-size: 1.1rem;
}

.success-actions {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: var(--transition-fast);
}

.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--text-secondary);
}
</style>
