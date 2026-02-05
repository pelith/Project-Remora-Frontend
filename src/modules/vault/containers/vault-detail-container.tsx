import { useAtomValue } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { getVaultAtom } from '../stores/vault.store';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';
import { ChevronLeft } from 'lucide-react';

interface VaultDetailContainerProps {
	vaultId: string;
}

export default function VaultDetailContainer({
	vaultId,
}: VaultDetailContainerProps) {
	const navigate = useNavigate();
	const vault = useAtomValue(getVaultAtom(vaultId));

	if (!vault) {
		return (
			<Container className='py-8'>
				<div className='text-center py-20'>
					<h1 className='text-2xl font-bold text-text-primary mb-4'>
						Vault not found
					</h1>
					<Button onClick={() => navigate({ to: '/vaults' })}>
						Back to Vaults
					</Button>
				</div>
			</Container>
		);
	}

	return (
		<Container className='py-4 space-y-6'>
			<Button
				variant='ghost'
				className='pl-0 gap-1 text-white hover:text-primary -ml-2 h-auto py-0.5 mb-3 text-xs'
				onClick={() => navigate({ to: '/vaults' })}
			>
				<ChevronLeft className='w-3 h-3' /> Back to Vaults
			</Button>
			<div>
				<h1 className='text-2xl font-bold text-text-primary'>
					{vault.poolKey.token0.symbol} / {vault.poolKey.token1.symbol}
				</h1>
				<p className='text-sm text-text-muted'>Vault ID: {vault.id}</p>
			</div>
			{/* TODO: Add vault detail components */}
		</Container>
	);
}

