import {
	Card,
	CardHeader,
	CardTitle,
	CardContent,
} from '@/modules/common/components/ui/card';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

export const PerformanceCard = () => {
	return (
		<Card>
			<CardHeader>
				<CardTitle className='text-lg'>Performance</CardTitle>
			</CardHeader>
			<CardContent>
				<div className='grid grid-cols-3 gap-4'>
					<div className='space-y-1'>
						<div className='flex items-center gap-1 text-xs text-text-muted'>
							<TrendingUp className='w-3 h-3' /> APR (Est.)
						</div>
						<div className='text-2xl font-bold text-success'>12.4%</div>
					</div>

					<div className='space-y-1'>
						<div className='flex items-center gap-1 text-xs text-text-muted'>
							<DollarSign className='w-3 h-3' /> Fees Earned
						</div>
						<div className='text-2xl font-bold text-text-primary'>$245.80</div>
					</div>

					<div className='space-y-1'>
						<div className='flex items-center gap-1 text-xs text-text-muted'>
							<Activity className='w-3 h-3' /> Rebalanced
						</div>
						<div className='text-lg font-medium text-text-secondary pt-1'>
							2h ago
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

