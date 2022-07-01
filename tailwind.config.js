/** @type {import('tailwindcss').Config} */

const defaultTheme = require( "tailwindcss/defaultTheme" );

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [ "Montserrat", ...defaultTheme.fontFamily.sans ],
        display: ["Montserrat"],
        headline: ["Montserrat"],
        title: ["Montserrat"],
        body: ["Montserrat"],
        label: ["Montserrat"],
      },
      colors: {
        /* Light theme */
        "primary-light": "#006874",
        "on-primary-light": "#ffffff",
        "primary-container-light": "#9af0ff",
        "on-primary-container-light": "#001f24",

        "secondary-light": "#4e42e7",
        "on-secondary-light": "#ffffff",
        "secondary-container-light": "#e3dfff",
        "on-secondary-container-light": "#100069",

        "tertiary-light": "#ad009c",
	      "on-tertiary-light": "#ffffff",
	      "tertiary-container-light": "#ffd7f1",
	      "on-tertiary-container-light": "#3a0033",

        "error-light": "#ba1a1a",
	      "on-error-light": "#ffffff",
	      "color-error-container-light": "#ffdad6",
	      "on-error-container-light": "#410002",

        "outline-light": "#6f797b",
        "background-light": "#fbfcfd",
	      "on-background-light": "#191c1d",

        "surface-light": "#fbfcfd",
	      "on-surface-light": "#191c1d",
	      "surface-variant-light": "#dbe4e6",
	      "on-surface-variant-light": "#3f484a",
	      "inverse-surface-light": "#2e3132",
        "inverse-on-surface-light": "#eff1f1",

        /* Dark theme */
        "primary-dark": "#4dd8ec",
        "on-primary-dark": "#00363d",
        "primary-container-dark": "#004f58",
        "on-primary-container-dark": "#9af0ff",

        "secondary-dark": "#c3c0ff",
        "on-secondary-dark": "#1f00a4",
        "secondary-container-dark": "#341fd0",
        "on-secondary-container-dark": "#e3dfff",

        "tertiary-dark": "#fface9",
        "on-tertiary-dark": "#5d0054",
        "tertiary-container-dark": "#840077",
        "on-tertiary-container-dark": "#ffd7f1",

        "error-dark": "#ffb4ab",
        "on-error-dark": "#690005",
        "error-container-dark": "#93000a",
        "on-error-container-dark": "#ffdad6",

        "outline-dark": "#899294",
        "background-dark": "#191c1d",
        "on-background-dark": "#e1e3e3",

        "surface-dark": "#191c1d",
        "on-surface-dark": "#e1e3e3",
        "surface-variant-dark": "#3f484a",
        "on-surface-variant-dark": "#bfc8ca",
        "inverse-surface-dark": "#e1e3e3",
        "inverse-on-surface-dark": "#191c1d",
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
