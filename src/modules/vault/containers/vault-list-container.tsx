import { useAtomValue } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { vaultsAtom } from '../stores/vault.store';
import {
	EmptyState,
	VaultCard,
	CreateVaultSheet,
} from '../components';
import { Button } from '@/modules/common/components/ui/button';
import { Container } from '@/modules/common/components/layout/container';
import { Plus } from 'lucide-react';

export default function VaultListContainer() {
	const vaults = useAtomValue(vaultsAtom);
	const navigate = useNavigate();
	const [isCreateOpen, setIsCreateOpen] = useState(false);

	const handleVaultClick = (vaultId: string) => {
		navigate({ to: '/vaults/$vaultId', params: { vaultId } });
	};

	// Skip wallet connection check for demo purposes

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

			<CreateVaultSheet
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</Container>
	);
}

