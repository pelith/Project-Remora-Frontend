import { createFileRoute } from '@tanstack/react-router';
import VaultDetailPage from '@/modules/vault/pages/vault-detail-page';

export const Route = createFileRoute('/vaults/$vaultId')({
	component: VaultDetailPage,
});

