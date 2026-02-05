import { Card } from '@/modules/common/components/ui/card';
import { Layers } from 'lucide-react';

export const EmptyState = () => {
	return (
		<Card className='flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-border-default bg-transparent'>
			<div className='h-16 w-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4'>
				<Layers className='h-8 w-8 text-text-muted' />
			</div>
			<h3 className='text-xl font-semibold text-text-primary mb-2'>
				No Vaults Found
			</h3>
			<p className='text-text-secondary max-w-sm mb-8'>
				You haven't created any liquidity vaults yet. Deploy your first AI agent
				to start earning.
			</p>
		</Card>
	);
};
