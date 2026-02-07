import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/modules/common/components/ui/alert-dialog';
import { useVaultPauseAndExitAll } from '@/modules/contracts/hooks/use-vault-pause-and-exit-all';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FullExitDialogProps {
	vaultAddress: string;
	trigger: React.ReactNode;
}

export const FullExitDialog = ({
	vaultAddress,
	trigger,
}: FullExitDialogProps) => {
	const { exitAll, isPending } = useVaultPauseAndExitAll(vaultAddress);

	const handleConfirm = async () => {
		try {
			await exitAll();
			toast.success('Full Exit Complete', {
				description: 'All positions closed. Funds moved to available balance.',
			});
		} catch (_error) {
			toast.error('Full Exit Failed');
		}
	};

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className='text-destructive'>
						Full Exit Strategy
					</AlertDialogTitle>
					<AlertDialogDescription className='space-y-2'>
						<span className='block'>
							This action will close all active positions and move all funds to
							your Available Balance. The AI Agent will be paused.
						</span>
						<span className='block'>
							After confirmation, you can withdraw these funds to your wallet.
						</span>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							handleConfirm();
						}}
						className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						disabled={isPending}
					>
						{isPending ? (
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
