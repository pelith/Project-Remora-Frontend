import VaultListContainer from '../containers/vault-list-container';
import VaultWalletContainer from '../containers/vault-wallet-container';

export default function VaultListPage() {
	return <VaultWalletContainer vaultListContainer={<VaultListContainer />} />;
}
