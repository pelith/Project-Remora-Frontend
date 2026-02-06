import { useAppKitAccount } from '@reown/appkit/react';
import { useAtomValue } from 'jotai';
import { Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';
import { useTokenInfoAndBalance } from '@/modules/contracts/hooks/use-token-info-and-balance';
import {
	useUserVaultsIds,
	useVault,
} from '@/modules/contracts/hooks/use-user-vault';
import { EmptyState } from '../components';
import { VaultCard } from '../components/vault-card';
import { vaultsAtom } from '../stores/vault.store';
import { CreateVaultSheet } from './create-vault-sheet-container';

export default function VaultListContainer() {
	const vaults = useAtomValue(vaultsAtom);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { address = '' } = useAppKitAccount();
	const { data, isLoading, refetch } = useUserVaultsIds({ address });

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
	const { data: vault } = useVault({ vaultAddress });
	const token0 = useTokenInfoAndBalance(vaultAddress, vault?.currency0 ?? '');
	const token1 = useTokenInfoAndBalance(vaultAddress, vault?.currency1 ?? '');

	return (
		<VaultCard
			vaultId={vaultAddress}
			token0Symbol={token0?.symbol ?? ''}
			token1Symbol={token1?.symbol ?? ''}
			totalValueUSD={'-'}
			availableToken0={token0?.balance ?? '0'}
			availableToken1={token1?.balance ?? '0'}
			agentStatus={vault?.agentPaused ?? 'not-started'}
			fee={vault?.fee ?? 0}
		/>
	);
}
