import { ref, watch } from 'vue';

export interface Theme {
  id: string;
  colors: string[]; // 4 colors from colorhunt
}

export interface UserProfile {
  name: string;
  photoUrl: string;
}

export interface SettingsState {
  profile: UserProfile;
  customThemes: Theme[];
  currentThemeId: string;
  isDarkMode: boolean;
}

const STORAGE_KEY = 'klipper-settings';

const defaultSettings: SettingsState = {
  profile: { name: 'Klipper User', photoUrl: '' },
  customThemes: [],
  currentThemeId: 'default',
  isDarkMode: false
};

const settings = ref<SettingsState>(defaultSettings);

// Singleton logic
let initialized = false;

export function useSettings() {
  if (!initialized) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        settings.value = { ...defaultSettings, ...JSON.parse(stored) };
      } catch (e) {
        console.error('Failed to parse settings');
      }
    }

    // Apply dark mode class initially
    if (settings.value.isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    applyThemeVariables(settings.value.currentThemeId, settings.value.customThemes);

    watch(() => settings.value, (newSettings) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    }, { deep: true });

    initialized = true;
  }

  const toggleDarkMode = (isDark: boolean) => {
    settings.value.isDarkMode = isDark;
    previewDarkMode(isDark);
  };

  const previewDarkMode = (isDark: boolean) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveSettings = (newState: Partial<SettingsState>) => {
    settings.value = { ...settings.value, ...newState };
    if (newState.isDarkMode !== undefined) {
       toggleDarkMode(newState.isDarkMode);
    }
    applyThemeVariables(settings.value.currentThemeId, settings.value.customThemes);
  };

  return {
    settings,
    saveSettings,
    toggleDarkMode,
    previewDarkMode,
    applyThemeVariables
  };
}

function getContrastYIQ(hexcolor: string) {
  if (hexcolor.startsWith('#')) {
    hexcolor = hexcolor.slice(1);
  }
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(c => c + c).join('');
  }
  const r = parseInt(hexcolor.substr(0, 2), 16);
  const g = parseInt(hexcolor.substr(2, 2), 16);
  const b = parseInt(hexcolor.substr(4, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#17141d' : '#ffffff';
}

function applyThemeVariables(themeId: string, themes: Theme[]) {
  const root = document.documentElement;
  
  if (themeId === 'default') {
    // Remove custom CSS variables added by JS to fallback to style.css values
    root.style.removeProperty('--accent-primary');
    root.style.removeProperty('--accent-secondary');
    root.style.removeProperty('--accent-gradient');
    root.style.removeProperty('--accent-gradient-hover');
    root.style.removeProperty('--accent-glow');
    root.style.removeProperty('--selection-color');
    root.style.removeProperty('--accent-text');
    return;
  }

  const theme = themes.find(t => t.id === themeId);
  if (!theme || theme.colors.length < 4) return;

  // Solo aplicamos a las letras/acentos que ya tienen color
  // Los primeros dos o los últimos dos colores del tema de colorhunt
  // Por lo general, [0] y [1] o [2] y [3] son los colores vibrantes
  const accentPrimary = theme.colors[0];
  const accentSecondary = theme.colors[1];
  
  root.style.setProperty('--accent-primary', accentPrimary);
  root.style.setProperty('--accent-secondary', accentSecondary);
  
  // Calculate appropriate text color for buttons using accent background
  const accentText = getContrastYIQ(accentPrimary);
  root.style.setProperty('--accent-text', accentText);
  
  // Derived variables
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accentPrimary} 0%, ${accentSecondary} 100%)`);
  root.style.setProperty('--accent-gradient-hover', `linear-gradient(135deg, ${accentPrimary} 0%, ${accentPrimary} 100%)`);
  
  // Fake transparency (33 = ~20% opacity)
  root.style.setProperty('--accent-glow', `${accentPrimary}33`);
  root.style.setProperty('--selection-color', `${accentPrimary}33`);
}
