// Minimal typing for `import.meta.glob`, which Vitest implements at test
// time. Kept local so the backend package does not depend on all of Vite.
interface ImportMeta {
  glob(pattern: string): Record<string, () => Promise<unknown>>
}
