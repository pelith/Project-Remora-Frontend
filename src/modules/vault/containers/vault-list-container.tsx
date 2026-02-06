import { useAppKitAccount } from '@reown/appkit/react';
import { useAtomValue } from 'jotai';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';
import {
	useUserVaultsIds,
	useVault,
} from '@/modules/contracts/hooks/use-user-vault';
import { useVaultAssets } from '@/modules/contracts/hooks/use-vault-assets';
import { EmptyState } from '../components';
import { VaultCard } from '../components/vault-card';
import { vaultsAtom } from '../stores/vault.store';
import { CreateVaultSheet } from './create-vault-sheet-container';

export default function VaultListContainer() {
	const vaults = useAtomValue(vaultsAtom);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { address = '' } = useAppKitAccount();
	const { data, refetch } = useUserVaultsIds({ address });

	const userVaultIds = data ?? [];

	// Skip wallet connection check for demo purposes

	useEffect(() => {
		refetch();
	}, [isCreateOpen]);

	return (
		<Container className='py-8'>
			<div className='flex flex-col sm:flex-row items-center justify-between mb-8 gap-4'>
				<div>
					<h1 className='text-2xl font-bold text-text-primary'>My Vaults</h1>
					<p className='text-sm text-text-muted'>
						Manage your automated liquidity positions
					</p>
				</div>
				<Button
					onClick={() => setIsCreateOpen(true)}
					className='gap-2 w-full sm:w-auto'
				>
					<Plus className='w-4 h-4' /> Create New Vault
				</Button>
			</div>

			{vaults.length === 0 ? (
				<EmptyState />
			) : (
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
					{userVaultIds.map((vault) => (
						<VaultCardContainer key={vault} vaultAddress={vault} />
					))}
				</div>
			)}

			<CreateVaultSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</Container>
	);
}

function VaultCardContainer({ vaultAddress }: { vaultAddress: string }) {
	const { data: vault, isLoading: isVaultLoading } = useVault({
		vaultAddress,
	});
	const vaultAssets = useVaultAssets({ vaultAddress });
	const isLoading = isVaultLoading || vaultAssets.isLoading;

	// Use vaultAddress as vaultId for navigation
	// The vault detail page will use this address to fetch vault data
	if (isLoading) {
		return (
			<div className='flex items-center justify-center p-8'>
				<p className='text-text-muted'>Loading vault...</p>
			</div>
		);
	}

	// Use data from useVaultAssets (which already includes token info from useVaultAvailableBalance)
	// Each field can be undefined independently, so we handle them separately
	const token0Symbol = vaultAssets.data?.token0?.symbol ?? '';
	const token1Symbol = vaultAssets.data?.token1?.symbol ?? '';

	// Format total value - pass numeric value to formatValueToStandardDisplay
	const totalValueUSD = vaultAssets.data?.totalValueUSD ?? '-';

	// Use total token amounts from vault assets
	const token0Amount = vaultAssets.data?.token0?.amount ?? '0';
	const token1Amount = vaultAssets.data?.token1?.amount ?? '0';

	return (
		<VaultCard
			vaultId={vaultAddress}
			token0Symbol={token0Symbol}
			token1Symbol={token1Symbol}
			totalValueUSD={totalValueUSD}
			availableToken0={token0Amount}
			availableToken1={token1Amount}
			agentStatus={vault?.agentPaused ? 'paused' : 'active'}
			fee={vault?.fee ?? 0}
		/>
	);
}
