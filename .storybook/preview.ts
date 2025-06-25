import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/nextjs-vite";

import "../src/app/globals.css";

const preview: Preview = {
	parameters: {
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},

		a11y: {
			// 'todo' - show a11y violations in the test UI only
			// 'error' - fail CI on a11y violations
			// 'off' - skip a11y checks entirely
			test: "todo",
		},

		backgrounds: {
			options: {
				dark: { name: "Light", value: "oklab(99.1% 0 0)" },
				light: { name: "Dark", value: "oklab(13.2% 0.01 0.01)" },
			}
		}
	},
	initialGlobals: {
		backgrounds: { value: "dark"},
	}
};

export const decorators = [
	withThemeByClassName({
		themes: {
			light: "",
			dark: "dark",
		},
		defaultTheme: "dark",
	}),
];

export default preview;
