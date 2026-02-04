import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

if (!projectId) {
	throw new Error('VITE_REOWN_PROJECT_ID is not defined');
}

export const config = new WagmiAdapter({
	networks: [sepolia],
	projectId,
	ssr: false,
	connectors: [injected()],
	transports: {
		[sepolia.id]: http(),
	},
});

createAppKit({
	adapters: [config],
	networks: [sepolia],
	projectId,
	metadata: {
		name: 'Project Remora',
		description: 'Project Remora',
		url: 'https://remora-stable.vercel.app',
		icons: ['https://remora-stable.vercel.app/favicon.ico'],
	},
	features: {
		email: false,
		socials: false,
	},
	enableNetworkSwitch: false,
});
declare module 'wagmi' {
	interface Register {
		config: typeof config;
	}
}
