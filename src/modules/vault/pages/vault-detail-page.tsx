import { useParams } from '@tanstack/react-router';
import VaultDetailContainer from '../containers/vault-detail-container';

export default function VaultDetailPage() {
	const { vaultId } = useParams({ from: '/vaults/$vaultId' });
	console.log('vaultId', vaultId);
	return <VaultDetailContainer vaultId={vaultId} />;
}
