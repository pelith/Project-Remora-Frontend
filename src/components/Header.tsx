import {
	useAppKit,
	useAppKitAccount,
	useDisconnect,
} from '@reown/appkit/react';
import { Link } from '@tanstack/react-router';
import { Wallet } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { isAddress } from 'viem';
import { useEnsName } from 'wagmi';
import { cn } from '@/lib/utils';
import { Container } from '@/modules/common/components/layout/container';
import { Button } from '@/modules/common/components/ui/button';

export default function Header() {
	const { open } = useAppKit();
	const { address, isConnected } = useAppKitAccount();
	const { disconnect } = useDisconnect();
	const { data: ensName } = useEnsName({
		address: address as `0x${string}`,
		query: { enabled: isConnected && isAddress(address ?? '') },
	});

	const handleConnect = useCallback(() => {
		open({ view: 'Connect', namespace: 'eip155' });
	}, [open]);

	const formattedAddress = useMemo(() => {
		if (!address) {
			return '';
		}
		if (ensName) {
			return ensName;
		}
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}, [address]);

	function handleDisconnect() {
		confirm('Are you sure you want to disconnect?');
		disconnect();
	}

	return (
		<header className='sticky top-0 z-50 w-full border-b border-border-default bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60'>
			<Container>
				<div className='flex h-16 items-center justify-between gap-4'>
					<div className='flex items-center gap-4'>
						<Link
							to='/'
							className='flex items-center gap-2 hover:opacity-90 transition-opacity'
						>
							<img
								src='android-chrome-192x192.png'
								alt='Agentic Vault'
								className='h-8 w-8 rounded-full'
							/>
							<span className='text-lg font-bold text-text-primary tracking-tight'>
								Agentic
								<span className='text-primary drop-shadow-[0_0_8px_rgba(255,51,133,0.5)]'>
									Vault
								</span>
							</span>
						</Link>
					</div>

					<div className='flex items-center gap-3'>
						{isConnected && address ? (
							<div
								className={cn(
									'flex items-center gap-2 bg-surface-elevated border border-border-default rounded-full px-3 py-1 text-sm font-mono text-text-secondary cursor-pointer hover:bg-surface-elevated/80 transition-colors',
								)}
								onClickCapture={handleDisconnect}
							>
								<div className='h-2 w-2 rounded-full bg-success animate-pulse' />
								<span>{formattedAddress}</span>
							</div>
						) : (
							<Button onClick={handleConnect} className='gap-2'>
								<Wallet className='h-4 w-4' />
								Connect Wallet
							</Button>
						)}
					</div>
				</div>
			</Container>
		</header>
	);
}
