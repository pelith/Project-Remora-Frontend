import { useSetAtom } from 'jotai';
import type { Vault } from '../types/vault.types';
import { fullExitAtom } from '../stores/vault.store';
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
import { useAtomValue } from 'jotai';
import { isLoadingAtom } from '../stores/vault.store';

interface FullExitDialogProps {
	vault: Vault;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess: () => void;
}

export const FullExitDialog = ({
	vault,
	open,
	onOpenChange,
	onSuccess,
}: FullExitDialogProps) => {
	const fullExit = useSetAtom(fullExitAtom);
	const isLoading = useAtomValue(isLoadingAtom);

	const handleConfirm = async () => {
		try {
			await fullExit(vault.id);
			toast.success('Full Exit Complete', {
				description: 'All positions closed. Funds moved to available balance.',
			});
			onOpenChange(false);
			onSuccess();
		} catch (e) {
			toast.error('Full Exit Failed');
		}
	};

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='text-destructive'>
						Full Exit Strategy
					</AlertDialogTitle>
					<AlertDialogDescription className='space-y-2'>
						<span className='block'>
							This action will close all active positions and move all funds to
							your Available Balance. The AI Agent will be stopped.
						</span>
						<span className='block bg-surface-elevated p-3 rounded-md text-xs font-mono'>
							<span className='flex justify-between'>
								<span>Funds in Positions:</span>
								<span className='text-text-primary'>
									{vault.inPositions.token0.toFixed(4)} {vault.poolKey.token0.symbol} + {vault.inPositions.token1.toFixed(4)} {vault.poolKey.token1.symbol}
								</span>
							</span>
						</span>
						<span className='block'>
							After confirmation, you will be prompted to withdraw these funds
							to your wallet.
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className='w-4 h-4 animate-spin' />
						) : (
							'Confirm Full Exit'
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

