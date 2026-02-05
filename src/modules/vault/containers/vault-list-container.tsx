import { useAtomValue } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { vaultsAtom } from '../stores/vault.store';
import { EmptyState, VaultCard } from '../components';
import { Button } from '@/modules/common/components/ui/button';
import { Container } from '@/modules/common/components/layout/container';
import { Plus, Wallet } from 'lucide-react';

export default function VaultListContainer() {
	const vaults = useAtomValue(vaultsAtom);
	const { isConnected } = useAppKitAccount();
	const navigate = useNavigate();
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const handleVaultClick = (vaultId: string) => {
		navigate({ to: '/vaults/$vaultId', params: { vaultId } });
	};

	if (!isConnected) {
		return (
			<Container className='py-12'>
				<div className='flex flex-col items-center justify-center space-y-6 text-center py-20'>
					<h1 className='text-4xl font-bold tracking-tight'>
						Agentic <span className='text-primary'>Uniswap v4</span> Vaults
					</h1>
					<p className='text-text-secondary max-w-lg text-lg'>
						Automated liquidity management powered by AI agents. Connect your
						wallet to get started.
					</p>
					<Button size='lg' className='gap-2'>
						<Wallet className='w-5 h-5' /> Connect Wallet
					</Button>
				</div>
			</Container>
		);
	}

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
					{vaults.map((vault) => (
						<VaultCard
							key={vault.id}
							vault={vault}
							onClick={() => handleVaultClick(vault.id)}
						/>
					))}
				</div>
			)}

			{/* TODO: CreateVaultSheet will be added later */}
		</Container>
	);
}

