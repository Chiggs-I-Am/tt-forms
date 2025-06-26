This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Storybook

This project uses [Storybook](https://storybook.js.org/) for component development and documentation. Storybook provides an isolated environment to develop, test, and showcase UI components.

### Running Storybook

To start the Storybook development server:

```bash
npm run storybook
```

This will start Storybook at [http://localhost:6006](http://localhost:6006).

### Building Storybook

To build a static version of Storybook for deployment:

```bash
npm run build-storybook
```

This generates a static build in the `storybook-static` directory.

### Component Development

Our Storybook setup includes:

- **Shadcn-style theming**: Components follow a consistent design system with light/dark mode support
- **Theme switching**: Use the theme toggle in the Storybook toolbar to test components in both light and dark modes
- **Responsive testing**: Test components across different viewport sizes
- **Interactive controls**: Modify component props dynamically through Storybook's controls panel
- **Design tokens**: Components use our custom Tailwind CSS color tokens for consistent theming

### Writing Stories

Stories are located in the `stories/` directory and follow this structure:

```
stories/
├── components/     # Component stories
├── pages/         # Page stories  
└── forms/         # Form stories
```

Each story file should:
- Import the component from `@components/...`
- Define a default export with component metadata
- Export named story variations
- Use TypeScript for type safety

Example story structure:

```typescript
import MyComponent from "@components/my-component";
import { ComponentMeta, ComponentStory } from "@storybook/react";

export default {
  title: "Components/MyComponent",
  component: MyComponent,
} as ComponentMeta<typeof MyComponent>;

const Template: ComponentStory<typeof MyComponent> = (args) => (
  <MyComponent {...args} />
);

export const Default = Template.bind({});
Default.args = {
  // component props
};
```

### Design System

Components use our custom design tokens based on Material Design 3 principles:

- **Colors**: Primary, secondary, tertiary variants with light/dark mode support
- **Typography**: Montserrat font family with consistent scales
- **Spacing**: Tailwind CSS spacing system
- **Themes**: Automatic light/dark mode switching with `dark:` classes

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
