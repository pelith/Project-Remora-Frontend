import { createFileRoute } from '@tanstack/react-router';
import { ConnectWalletPage } from '../modules/connect-wallet';

export const Route = createFileRoute('/connect-wallet')({
	component: ConnectWalletPage,
});
