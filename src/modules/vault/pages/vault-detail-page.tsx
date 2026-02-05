import VaultDetailContainer from '../containers/vault-detail-container';
import { useParams } from '@tanstack/react-router';

export default function VaultDetailPage() {
	const { vaultId } = useParams({ from: '/vaults/$vaultId' });
	return <VaultDetailContainer vaultId={vaultId} />;
}

