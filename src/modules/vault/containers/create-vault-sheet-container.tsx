import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/modules/common/components/ui/button';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@/modules/common/components/ui/sheet';
import {
	CreateVaultProvider,
	useCreateVaultContext,
} from '../contexts/create-vault-context';
import { CreateVaultStep1Container } from './create-vault/create-vault-step-1-container';
import { CreateVaultStep2Container } from './create-vault/create-vault-step-2-container';
import { CreateVaultStep3Container } from './create-vault/create-vault-step-3-container';
import { CreateVaultStep4Container } from './create-vault/create-vault-step-4-container';

interface CreateVaultSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function CreateVaultSheetContent({
	open,
	onOpenChange,
}: CreateVaultSheetProps) {
	const {
		step,
		isLoading,
		isNextDisabled,
		handleBack,
		handleNext,
		handleCreate,
	} = useCreateVaultContext();

	const totalSteps = 4;
	const stepTitle = (() => {
		switch (step) {
			case 1:
				return 'Select Pool';
			case 2:
				return 'Configure Parameters';
			case 3:
				return 'Initial Deposit';
			case 4:
				return 'Review & Confirm';
			default:
				return '';
		}
	})();
	const stepDescription = (() => {
		switch (step) {
			case 1:
				return 'Choose a liquidity pool for your new Vault.';
			case 2:
				return 'Configure how the AI Agent manages your positions.';
			case 3:
				return 'Deposit assets to initialize the Vault.';
			case 4:
				return 'Review details and approve transaction.';
			default:
				return '';
		}
	})();

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='sm:max-w-[500px] bg-background border-l border-border-default overflow-y-auto'>
				<SheetHeader>
					<div className='flex items-center justify-between mb-2'>
						<SheetTitle>{stepTitle}</SheetTitle>
						<span className='text-xs text-text-muted'>
							Step {step} of {totalSteps}
						</span>
					</div>
					<div className='h-1 w-full bg-surface-elevated rounded-full overflow-hidden'>
						<div
							className='h-full bg-primary transition-all duration-300 ease-out'
							style={{ width: `${(step / totalSteps) * 100}%` }}
						/>
					</div>
					<SheetDescription>{stepDescription}</SheetDescription>
				</SheetHeader>

				<div className='mt-4'>
					{step === 1 && <CreateVaultStep1Container />}
					{step === 2 && <CreateVaultStep2Container />}
					{step === 3 && <CreateVaultStep3Container />}
					{step === 4 && <CreateVaultStep4Container />}
				</div>

				<SheetFooter className='absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border-default flex-row gap-3 sm:justify-between'>
					<Button
						variant='outline'
						onClick={handleBack}
						disabled={step === 1 || isLoading}
						className='w-1/3'
					>
						Back
					</Button>

					{step < totalSteps ? (
						<Button
							onClick={handleNext}
							disabled={isNextDisabled()}
							className='w-2/3'
						>
							Next <ChevronRight className='w-4 h-4 ml-2' />
						</Button>
					) : (
						<Button
							onClick={handleCreate}
							disabled={isLoading}
							className='w-2/3 relative overflow-hidden'
						>
							{isLoading ? (
								<>
									Creating <Loader2 className='w-4 h-4 ml-2 animate-spin' />
								</>
							) : (
								<>
									Confirm & Create <Check className='w-4 h-4 ml-2' />
								</>
							)}
						</Button>
					)}
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

export function CreateVaultSheet({
	open,
	onOpenChange,
}: CreateVaultSheetProps) {
	return (
		<CreateVaultProvider onOpenChange={onOpenChange}>
			<CreateVaultSheetContent open={open} onOpenChange={onOpenChange} />
		</CreateVaultProvider>
	);
}
