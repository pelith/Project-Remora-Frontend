import type { Vault } from '../types/vault.types';
import { Card } from '@/modules/common/components/ui/card';
import { Badge } from '@/modules/common/components/ui/badge';
import { ArrowRight, Wallet } from 'lucide-react';
import { formatCurrency } from '../utils/vault-utils';

interface VaultCardProps {
	vault: Vault;
	onClick?: () => void;
}

export const VaultCard = ({ vault, onClick }: VaultCardProps) => {
	const getBadgeVariant = (status: string) => {
		switch (status) {
			case 'active':
				return 'agentActive';
			case 'paused':
				return 'agentPaused';
			default:
				return 'agentNotStarted';
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'active':
				return 'Agent Active';
			case 'paused':
				return 'Agent Paused';
			default:
				return 'Not Started';
		}
	};

	return (
		<Card
			className='group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,51,133,0.15)] hover:-translate-y-1'
			onClick={onClick}
		>
			<div className='flex flex-col h-full justify-between'>
				<div>
					{/* Header */}
					<div className='flex items-center justify-between mb-4'>
						<div className='flex items-center gap-2'>
							<div className='flex -space-x-2'>
								<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold z-10'>
									{vault.poolKey.token0.symbol[0]}
								</div>
								<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold'>
									{vault.poolKey.token1.symbol[0]}
								</div>
							</div>
							<div>
								<div className='font-semibold text-text-primary text-sm'>
									{vault.poolKey.token0.symbol}/{vault.poolKey.token1.symbol}
								</div>
								<div className='text-xs text-text-muted'>
									{(vault.poolKey.fee / 10000).toFixed(2)}% Fee
								</div>
							</div>
						</div>
						<Badge variant={getBadgeVariant(vault.agentStatus)}>
							{getStatusLabel(vault.agentStatus)}
						</Badge>
					</div>

					{/* Metrics */}
					<div className='mb-4'>
						<div className='text-xs text-text-muted mb-1'>Total Value</div>
						<div className='text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]'>
							{formatCurrency(vault.totalValueUSD)}
						</div>
					</div>

					<div className='flex items-center justify-between pt-4 border-t border-border-default'>
						<div className='flex gap-2 text-xs text-text-secondary'>
							<div className='flex items-center gap-1'>
								<Wallet className='w-3 h-3' />
								{vault.availableBalance.token0} {vault.poolKey.token0.symbol}
							</div>
							<div>+</div>
							<div>
								{vault.availableBalance.token1} {vault.poolKey.token1.symbol}
							</div>
						</div>

						<div className='flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0'>
							View <ArrowRight className='w-3 h-3' />
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
};

