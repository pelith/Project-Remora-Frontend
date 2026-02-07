import { Loader2, Pause, Play } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
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
import { Button } from '@/modules/common/components/ui/button';
import { useTokenPrice } from '@/modules/contracts/hooks/use-token-price';
import { useSetAgentPause } from '@/modules/contracts/hooks/use-vault-agent-status';

interface AgentControlDialogProps {
	vaultAddress: string;
	vaultConfigK: number;
	vaultConfigTickLower: number;
	vaultConfigTickUpper: number;
	vaultSwapAllowed: boolean;
	vaultPoolKeyToken0Symbol: string;
	vaultPoolKeyToken1Symbol: string;
}

export const AgentControlDialog = ({
	vaultAddress,
	vaultConfigK,
	vaultConfigTickLower,
	vaultConfigTickUpper,
	vaultSwapAllowed,
	vaultPoolKeyToken0Symbol,
	vaultPoolKeyToken1Symbol,
}: AgentControlDialogProps) => {
	// const startAgent = useSetAtom(startAgentAtom);
	// const pauseAgent = useSetAtom(pauseAgentAtom);
	// const resumeAgent = useSetAtom(resumeAgentAtom);
	// const isLoading = useAtomValue(isLoadingAtom);

	const { agentStatus, setAgentPause, ...rest } =
		useSetAgentPause(vaultAddress);

	const [open, setOpen] = useState(false);

	const { data: price0Info } = useTokenPrice({
		id: vaultPoolKeyToken0Symbol.toLowerCase(),
	});

	const handleConfirm = async (desiredStatus: 'start' | 'pause') => {
		try {
			if (desiredStatus === 'start') {
				await setAgentPause({ vaultAddress, desiredStatus: false });
				toast.success('Agent Started', {
					description: 'Your liquidity is now being actively managed.',
				});
			}
			if (desiredStatus === 'pause') {
				await setAgentPause({ vaultAddress, desiredStatus: true });
				toast.info('Agent Paused', {
					description: 'Rebalancing has been suspended. Positions remain open.',
				});
			}
			setOpen(false);
		} catch (_e) {
			toast.error('Operation Failed', {
				description: 'Please try again later.',
			});
		}
	};

	const getTargetRangeDisplay = () => {
		const currentPrice = price0Info?.price ?? 0;
		// Assuming config ticks are BPS relative to current price (0 tick = current price)
		const minPrice = currentPrice * (1 + vaultConfigTickLower / 10000);
		const maxPrice = currentPrice * (1 + vaultConfigTickUpper / 10000);

		return `${minPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} - ${maxPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${vaultPoolKeyToken1Symbol}`;
	};

	const getContent = () => {
		let action: 'pause' | 'resume';
		if (agentStatus.data === true) {
			action = 'resume';
		} else {
			action = 'pause';
		}
		switch (action) {
			case 'resume':
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
										{vaultConfigK === 0 ? 'Unlimited' : vaultConfigK}
									</span>
								</div>
								<div className='flex justify-between items-center'>
									<span className='text-text-muted'>Swap Enabled:</span>
									<span className='font-mono font-medium text-text-primary'>
										{vaultSwapAllowed ? 'Yes' : 'No'}
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
		}
	};

	const content = getContent();

	return (
		<>
			{agentStatus.data === false ? (
				<Button
					onClick={() => setOpen(true)}
					className='w-full h-10 border-warning/20 bg-warning/80 text-warning-foreground hover:bg-warning hover:border-warning/30 text-xs font-semibold shadow-md shadow-warning/10'
				>
					<Pause className='w-3.5 h-3.5 mr-2' /> Pause Agent
				</Button>
			) : (
				<Button
					onClick={() => setOpen(true)}
					className={cn(
						'w-full h-10 text-xs font-semibold shadow-md',
						agentStatus.data === true
							? 'bg-success hover:bg-success/90 text-success-foreground shadow-success/10'
							: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/10',
					)}
				>
					<Play className='w-3.5 h-3.5 mr-2' /> Resume Agent
				</Button>
			)}
			<AlertDialog open={open} onOpenChange={setOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{content.title}</AlertDialogTitle>
						<AlertDialogDescription>{content.desc}</AlertDialogDescription>
						{content.params}
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={rest.isPending}>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirm(agentStatus.data === false ? 'pause' : 'start');
							}}
							disabled={rest.isPending}
							className={
								agentStatus.data === false
									? 'bg-warning text-warning-foreground hover:bg-warning/90'
									: ''
							}
						>
							{rest.isPending ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								content.btn
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
