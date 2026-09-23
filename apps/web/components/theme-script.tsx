"use client"

import { useServerInsertedHTML } from "next/navigation"

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("tt-forms-theme");if(t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`

// Sets the initial theme class before hydration so the first paint matches
// the stored or system theme. Injected via useServerInsertedHTML, which
// lands in the SSR stream outside the React tree: unlike next-themes'
// inline <script> or next/script, React 19 never sees it and raises no
// "script tag in component" warning.
export function ThemeScript() {
  useServerInsertedHTML(() => (
    <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  ))
  return null
}
