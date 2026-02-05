import type { Vault } from '../types/vault.types';
import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '@/modules/common/components/ui/card';
import { Badge } from '@/modules/common/components/ui/badge';
import { Button } from '@/modules/common/components/ui/button';
import { Play, Pause, Settings, Download, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '../utils/vault-utils';

interface VaultOverviewProps {
	vault: Vault;
	onDeposit: () => void;
	onWithdraw: () => void;
	onFullExit: () => void;
	onAgentControl: (action: 'start' | 'pause' | 'resume') => void;
}

export const VaultOverview = ({
	vault,
	onDeposit,
	onWithdraw,
	onFullExit,
	onAgentControl,
}: VaultOverviewProps) => {
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
		<Card className='h-full'>
			<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
				<div className='space-y-1'>
					<CardTitle className='text-xl flex items-center gap-2'>
						{vault.poolKey.token0.symbol} / {vault.poolKey.token1.symbol}
						<span className='text-sm font-normal text-text-muted px-2 py-0.5 rounded-full bg-surface-elevated'>
							{(vault.poolKey.fee / 10000).toFixed(2)}%
						</span>
					</CardTitle>
					<p className='text-sm text-text-muted'>ID: {vault.id}</p>
				</div>
				<Badge variant={getBadgeVariant(vault.agentStatus)} className='text-sm px-3 py-1'>
					{getStatusLabel(vault.agentStatus)}
				</Badge>
			</CardHeader>

			<CardContent className='space-y-6'>
				{/* Main Value */}
				<div>
					<div className='text-sm text-text-muted mb-1'>Total Vault Value</div>
					<div className='text-4xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]'>
						{formatCurrency(vault.totalValueUSD)}
					</div>
				</div>

				{/* Breakdown */}
				<div className='grid grid-cols-2 gap-4 py-4 border-t border-b border-border-default'>
					<div>
						<div className='text-xs text-text-muted uppercase tracking-wider mb-2'>
							Available Balance
						</div>
						<div className='space-y-1 font-mono text-sm'>
							<div className='flex justify-between'>
								<span>{vault.availableBalance.token0.toFixed(4)}</span>
								<span className='text-text-muted'>
									{vault.poolKey.token0.symbol}
								</span>
							</div>
							<div className='flex justify-between'>
								<span>{vault.availableBalance.token1.toFixed(2)}</span>
								<span className='text-text-muted'>
									{vault.poolKey.token1.symbol}
								</span>
							</div>
						</div>
					</div>
					<div>
						<div className='text-xs text-text-muted uppercase tracking-wider mb-2'>
							In Positions
						</div>
						<div className='space-y-1 font-mono text-sm'>
							<div className='flex justify-between'>
								<span>{vault.inPositions.token0.toFixed(4)}</span>
								<span className='text-text-muted'>
									{vault.poolKey.token0.symbol}
								</span>
							</div>
							<div className='flex justify-between'>
								<span>{vault.inPositions.token1.toFixed(2)}</span>
								<span className='text-text-muted'>
									{vault.poolKey.token1.symbol}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Actions */}
				<div className='space-y-3'>
					<div className='grid grid-cols-2 gap-3'>
						<Button
							onClick={onDeposit}
							className='w-full gap-2 hover:shadow-[0_0_15px_rgba(255,51,133,0.3)] transition-all'
						>
							<Upload className='w-4 h-4' /> Deposit
						</Button>
						<Button
							variant='outline'
							onClick={onWithdraw}
							className='w-full gap-2 hover:bg-surface-elevated'
						>
							<Download className='w-4 h-4' /> Withdraw
						</Button>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						{vault.agentStatus === 'active' ? (
							<Button
								variant='secondary'
								onClick={() => onAgentControl('pause')}
								className='w-full gap-2 text-warning hover:text-warning hover:bg-warning/10'
							>
								<Pause className='w-4 h-4' /> Pause Agent
							</Button>
						) : (
							<Button
								variant={
									vault.agentStatus === 'paused' ? 'default' : 'outline'
								}
								onClick={() =>
									onAgentControl(
										vault.agentStatus === 'paused' ? 'resume' : 'start',
									)
								}
								className={cn(
									'w-full gap-2',
									vault.agentStatus === 'not-started' &&
										'border-primary text-primary hover:bg-primary/10',
								)}
							>
								<Play className='w-4 h-4' />{' '}
								{vault.agentStatus === 'paused'
									? 'Resume Agent'
									: 'Start Agent'}
							</Button>
						)}

						<Button
							variant='ghost'
							size='icon'
							className='w-full border border-border-default text-text-muted'
						>
							<Settings className='w-4 h-4' />
						</Button>
					</div>

					<Button
						variant='ghost'
						onClick={onFullExit}
						className='w-full gap-2 text-error hover:text-error hover:bg-error/10 mt-2'
					>
						<Trash2 className='w-4 h-4' /> Full Exit (Close & Withdraw)
					</Button>
				</div>
			</CardContent>
		</Card>
	);
};

