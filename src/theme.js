import { ref } from "vue";
import Aura from "@primeuix/themes/aura";
import Lara from "@primeuix/themes/lara"; // Другая тема PrimeVue

const theme = ref(localStorage.getItem("theme") || "aura");

const themes = {
    aura: Aura,
    lara: Lara
};

const setTheme = (newTheme) => {
    theme.value = newTheme;
    localStorage.setItem("theme", newTheme);
};

export { theme, themes, setTheme };
