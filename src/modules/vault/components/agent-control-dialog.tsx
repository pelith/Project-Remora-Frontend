import { useSetAtom, useAtomValue } from 'jotai';
import type { Vault } from '../types/vault.types';
import {
	startAgentAtom,
	pauseAgentAtom,
	resumeAgentAtom,
	isLoadingAtom,
} from '../stores/vault.store';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/modules/common/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getMockPrice } from '../utils/vault-utils';

interface AgentControlDialogProps {
	vault: Vault;
	action: 'start' | 'pause' | 'resume';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export const AgentControlDialog = ({
	vault,
	action,
	open,
	onOpenChange,
}: AgentControlDialogProps) => {
	const startAgent = useSetAtom(startAgentAtom);
	const pauseAgent = useSetAtom(pauseAgentAtom);
	const resumeAgent = useSetAtom(resumeAgentAtom);
	const isLoading = useAtomValue(isLoadingAtom);

	const handleConfirm = async () => {
		try {
			if (action === 'start') {
				await startAgent(vault.id);
				toast.success('Agent Started', {
					description: 'Your liquidity is now being actively managed.',
				});
			}
			if (action === 'pause') {
				await pauseAgent(vault.id);
				toast.info('Agent Paused', {
					description: 'Rebalancing has been suspended. Positions remain open.',
				});
			}
			if (action === 'resume') {
				await resumeAgent(vault.id);
				toast.success('Agent Resumed', {
					description: 'Active management has restarted.',
				});
			}
			onOpenChange(false);
		} catch (e) {
			toast.error('Operation Failed', {
				description: 'Please try again later.',
			});
		}
	};

	const getTargetRangeDisplay = () => {
		const currentPrice = getMockPrice(vault.poolKey.token0.symbol);
		// Assuming config ticks are BPS relative to current price (0 tick = current price)
		const minPrice = currentPrice * (1 + vault.config.tickLower / 10000);
		const maxPrice = currentPrice * (1 + vault.config.tickUpper / 10000);

		return `${minPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vault.poolKey.token1.symbol}`;
	};

	const getContent = () => {
		switch (action) {
			case 'start':
				return {
					title: 'Start AI Agent',
					desc: 'The agent will analyze the market and deploy 80% of your available funds into optimal positions. This may take a few moments.',
					btn: 'Start Agent',
					params: (
						<div className='bg-surface-elevated/50 p-4 rounded-md space-y-3 border border-border-default/50 mt-4'>
							<div className='text-xs font-medium text-text-muted uppercase tracking-wider mb-2'>
								Strategy Configuration
							</div>
							<div className='space-y-2 text-sm'>
								<div className='flex justify-between items-center'>
									<span className='text-text-muted'>Target Range:</span>
									<span className='font-mono font-medium text-text-primary'>
										{getTargetRangeDisplay()}
									</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-text-muted'>Max Positions:</span>
									<span className='font-mono font-medium text-text-primary'>
										{vault.config.k === 0 ? 'Unlimited' : vault.config.k}
									</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-text-muted'>Swap Enabled:</span>
									<span className='font-mono font-medium text-text-primary'>
										{vault.config.swapAllowed ? 'Yes' : 'No'}
									</span>
								</div>
							</div>
						</div>
					),
				};
			case 'pause':
				return {
					title: 'Pause AI Agent',
					desc: 'The agent will stop rebalancing positions. Your existing positions will remain active and continue earning fees, but will not be managed.',
					btn: 'Pause Agent',
					params: null,
				};
			case 'resume':
				return {
					title: 'Resume AI Agent',
					desc: 'The agent will resume active management and rebalancing of your positions.',
					btn: 'Resume Agent',
					params: null,
				};
		}
	};

	const content = getContent();

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{content.title}</AlertDialogTitle>
					<AlertDialogDescription>{content.desc}</AlertDialogDescription>
					{content.params}
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						disabled={isLoading}
						className={
							action === 'pause'
								? 'bg-warning text-warning-foreground hover:bg-warning/90'
								: ''
						}
					>
						{isLoading ? (
							<Loader2 className='w-4 h-4 animate-spin' />
						) : (
							content.btn
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
