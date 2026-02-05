import { useAppKit } from '@reown/appkit/react';
import { Wallet } from 'lucide-react';
import { useConnection } from 'wagmi';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';
export default function VaultWalletContainer({
	vaultListContainer,
}: {
	vaultListContainer: React.ReactNode;
}) {
	const { open } = useAppKit();
	const { isConnected } = useConnection();
	if (isConnected) {
		return vaultListContainer;
	}
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
				<Button
					size='lg'
					onClick={() => open({ view: 'Connect', namespace: 'eip155' })}
					className='gap-2'
				>
					<Wallet className='w-5 h-5' /> Connect Wallet
				</Button>
			</div>
		</Container>
	);
}
