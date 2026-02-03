import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';

import * as TanStackQueryProvider from './integrations/tanstack-query/root-provider.tsx';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './styles.css';
import { WagmiProvider } from 'wagmi';
import { ThemeProvider } from './modules/common/layouts/theme-provider.tsx';
import { AtomStoreProvider } from './modules/common/store/store.tsx';
import reportWebVitals from './reportWebVitals.ts';
import { config } from './wagmi.ts';

// Create a new router instance

const TanStackQueryProviderContext = TanStackQueryProvider.getContext();
const router = createRouter({
	routeTree,
	context: {
		...TanStackQueryProviderContext,
	},
	defaultPreload: 'intent',
	scrollRestoration: true,
	defaultStructuralSharing: true,
	defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
	const root = ReactDOM.createRoot(rootElement);
	root.render(
		<StrictMode>
			<ThemeProvider defaultTheme='dark'>
				<TanStackQueryProvider.Provider {...TanStackQueryProviderContext}>
					<WagmiProvider config={config.wagmiConfig}>
						<AtomStoreProvider>
							<RouterProvider router={router} />
						</AtomStoreProvider>
					</WagmiProvider>
				</TanStackQueryProvider.Provider>
			</ThemeProvider>
		</StrictMode>,
	);
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
