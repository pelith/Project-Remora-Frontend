import { Link } from '@tanstack/react-router';
import { ArrowRight, Wallet } from 'lucide-react';
import { ImageWithFallback } from '@/modules/common/components/image-with-fallback';
import { Badge } from '@/modules/common/components/ui/badge';
import { Card } from '@/modules/common/components/ui/card';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import { TOKEN_METADATA } from '@/modules/contracts/constants/pool-examples';

interface VaultCardProps {
	vaultId: string;
	token0Symbol: string;
	token1Symbol: string;
	totalValueUSD: string;
	availableToken0: string;
	availableToken1: string;
	agentStatus: string;
	fee: number;
}

export const VaultCard = ({
	vaultId,
	token0Symbol,
	token1Symbol,
	totalValueUSD,
	availableToken0,
	availableToken1,
	agentStatus,
	fee,
}: VaultCardProps) => {
	const previewToken0 = TOKEN_METADATA[token0Symbol.toUpperCase()];
	const previewToken1 = TOKEN_METADATA[token1Symbol.toUpperCase()];
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
		<Link to='/vaults/$vaultId' params={{ vaultId: vaultId }} className='block'>
			<Card className='group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,51,133,0.15)] hover:-translate-y-1'>
				<div className='flex flex-col h-full justify-between'>
					<div>
						{/* Header */}
						<div className='flex items-center justify-between mb-4'>
							<div className='flex items-center gap-2'>
								<div className='flex -space-x-2'>
									<ImageWithFallback
										className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold z-10'
										src={previewToken0?.img}
										alt={previewToken0?.symbol}
									/>

									<ImageWithFallback
										className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold z-10'
										src={previewToken1?.img}
										alt={previewToken1?.symbol}
									/>
								</div>
								<div>
									<div className='font-semibold text-text-primary text-sm'>
										{token0Symbol}/{token1Symbol}
									</div>
									<div className='text-xs text-text-muted'>
										{(fee / 10000).toFixed(2)}% Fee
									</div>
								</div>
							</div>
							<Badge variant={getBadgeVariant(agentStatus)}>
								{getStatusLabel(agentStatus)}
							</Badge>
						</div>

						{/* Metrics */}
						<div className='mb-4'>
							<div className='text-xs text-text-muted mb-1'>Total Value</div>
							<div className='text-xl font-bold text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.1)]'>
								{totalValueUSD === '-'
									? '-'
									: `$${formatValueToStandardDisplay(totalValueUSD)}`}
							</div>
						</div>

						<div className='flex items-center justify-between pt-4 border-t border-border-default'>
							<div className='flex gap-2 text-xs text-text-secondary'>
								<div className='flex items-center gap-1'>
									<Wallet className='w-3 h-3' />
									{formatValueToStandardDisplay(availableToken0)} {token0Symbol}
								</div>
								<div>+</div>
								<div>
									{formatValueToStandardDisplay(availableToken1)} {token1Symbol}
								</div>
							</div>

							<div className='flex items-center gap-1 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0'>
								View <ArrowRight className='w-3 h-3' />
							</div>
						</div>
					</div>
				</div>
			</Card>
		</Link>
	);
};
