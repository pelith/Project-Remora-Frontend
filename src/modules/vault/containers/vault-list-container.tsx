import { useAtomValue } from 'jotai';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';
import { CreateVaultSheet, EmptyState, VaultCard } from '../components';
import { vaultsAtom } from '../stores/vault.store';

export default function VaultListContainer() {
	const vaults = useAtomValue(vaultsAtom);
	const [isCreateOpen, setIsCreateOpen] = useState(false);

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
						<VaultCard key={vault.id} vault={vault} />
					))}
				</div>
			)}

			<CreateVaultSheet open={isCreateOpen} onOpenChange={setIsCreateOpen} />
		</Container>
	);
}
