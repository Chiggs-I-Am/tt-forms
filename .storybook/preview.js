import "@styles/globals.css";
import * as NextImage from "next/image";

const OriginalNextImage = NextImage.default;

Object.defineProperty(NextImage, "default", {
  configurable: true,
  value: (props) => <OriginalNextImage {...props} unoptimized />,
});

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  previewTabs: {
    'storybook/docs/panel': { index: -1 },
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#fbfcfd',
      },
      {
        name: 'dark',
        value: '#191c1d',
      },
    ],
  },
  layout: 'centered',
};

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: ['light', 'dark'],
      showName: true,
    },
  },
};

const withThemeProvider = (Story, context) => {
  const theme = context.globals.theme || 'light';
  
  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' 
          ? 'bg-background-dark text-on-background-dark' 
          : 'bg-background-light text-on-background-light'
      }`}>
        <div className="p-4">
          <Story />
        </div>
      </div>
    </div>
  );
};

export const decorators = [withThemeProvider];