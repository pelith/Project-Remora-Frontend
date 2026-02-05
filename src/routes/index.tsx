import { createFileRoute } from '@tanstack/react-router';
import VaultListPage from '@/modules/vault/pages/vault-list-page';

export const Route = createFileRoute('/')({
	component: VaultListPage,
});
