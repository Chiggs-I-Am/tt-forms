---
applyTo: "**"
---

# GitHub Copilot Instructions

## General Principles

- This is a Next.js project using React with TypeScript.
- All styling is done with Tailwind CSS v4 and shadcn/ui.
- All code should adhere to the project's ESLint and Prettier configurations.
- Always use the `context7` MCP server for context-related operations and `github` for GitHub tasks.
- Don't create new files or directories unless the previous ones are finished.

## Naming Conventions

- **Files**: Use `kebab-case` (e.g., `max-width-wrapper.tsx`).
- **Variables & Functions**: Use `camelCase` (e.g., `const navLinks = ...`).
- **React Components & Classes**: Use `PascalCase` (e.g., `function Navbar() {}`).
- **CSS Classes**: Use descriptive names that align with BEM or a similar methodology where applicable, though Tailwind utility classes are preferred.

## Component Development

- **Structure**: Create components in `src/components`. Group related components into subdirectories (e.g., `src/components/layout/`).
- **Styling**: Use `tailwindCSS` utility classes directly in the JSX. For complex or reusable style sets, use `@apply` in a dedicated CSS module or use a library like `cva`.
- **Props**: Define component props using TypeScript interfaces.
- **State Management**: For simple state, use React Hooks (`useState`, `useEffect`). For complex or shared state, consider Zustand or React Context.

## Storybook

- **Stories**: For every new component, create a corresponding `.stories.tsx` file in the `src/stories` directory.
- **Organization**: Mirror the component's path in the `src/stories` directory (e.g., `src/components/ui/button.tsx` has a story at `src/stories/components/ui/button.stories.tsx`).
- **Args**: Use Storybook args to demonstrate all component variants and states.

## Coding Conventions

- **Functions**: Always use named functions instead of arrow functions for component and utility definitions where possible. This improves debuggability.
- **Imports**:
  - Organize imports in the following order: React, external libraries, internal modules/components, styles.
  - Use absolute paths for imports (`@/components/...`) instead of relative paths (`../../components/...`).
- **Strings**: Use double quotes (`"`) for all strings.
- **Braces**: Place function and control structure braces on a new line.
- **TypeScript**:
  - Use specific types instead of `any`.
  - Use interfaces for object shapes and props.
- **Git Commits**:
  - Write clear and concise commit messages.
  - Group commits by feature or bug fix. (e.g., "feat: add navbar component", "fix: correct button alignment").

## Suggested Additions for Your Consideration:

### Accessibility (a11y)

- Ensure all interactive elements are keyboard-navigable.
- Use semantic HTML5 elements (`<nav>`, `<main>`, `<aside>`, etc.).
- Provide `alt` text for all images.
- Use `aria-*` attributes where necessary to improve screen reader support.

### Testing

- Write unit tests for complex functions and components using Vitest.
- Write integration tests for user flows.
- Ensure tests are co-located with the code they are testing or in a dedicated `__tests__` directory.

### API Interaction

- Use a consistent method for fetching data (e.g., a dedicated hook like `useSWR` or `react-query`, or a service layer).
- Define API response shapes with TypeScript interfaces.
