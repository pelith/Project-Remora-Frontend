import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
	type?: 'spinner' | 'skeleton-row' | 'skeleton-card' | 'page';
	count?: number;
	className?: string;
	text?: string;
}

export const LoadingState = ({
	type = 'spinner',
	count = 1,
	className,
	text,
}: LoadingStateProps) => {
	if (type === 'page') {
		return (
			<div
				className={cn(
					'flex flex-col items-center justify-center min-h-[400px] w-full gap-4',
					className,
				)}
			>
				<Loader2 className='h-10 w-10 animate-spin text-primary' />
				{text && (
					<p className='text-text-muted animate-pulse font-medium'>{text}</p>
				)}
			</div>
		);
	}

	if (type === 'skeleton-card') {
		return (
			<div className={cn('grid gap-4', className)}>
				{Array.from({ length: count }).map((_, i) => (
					<div
						key={i}
						className='rounded-xl border border-border-default/50 bg-surface-card/50 p-6 space-y-4 animate-pulse'
					>
						<div className='h-6 w-1/3 bg-surface-elevated rounded' />
						<div className='space-y-2'>
							<div className='h-4 w-full bg-surface-elevated/50 rounded' />
							<div className='h-4 w-5/6 bg-surface-elevated/50 rounded' />
						</div>
						<div className='pt-4 flex gap-2'>
							<div className='h-8 w-24 bg-surface-elevated rounded' />
						</div>
					</div>
				))}
			</div>
		);
	}

	if (type === 'skeleton-row') {
		return (
			<div className={cn('space-y-2', className)}>
				{Array.from({ length: count }).map((_, i) => (
					<div key={i} className='flex items-center space-x-4 py-2'>
						<div className='h-10 w-10 rounded-full bg-surface-elevated animate-pulse' />
						<div className='space-y-2 flex-1'>
							<div className='h-4 w-[250px] bg-surface-elevated animate-pulse rounded' />
							<div className='h-3 w-[200px] bg-surface-elevated/50 animate-pulse rounded' />
						</div>
					</div>
				))}
			</div>
		);
	}

	return (
		<div className={cn('flex items-center justify-center p-4', className)}>
			<Loader2 className='h-6 w-6 animate-spin text-primary' />
			{text && <span className='ml-2 text-sm text-text-muted'>{text}</span>}
		</div>
	);
};

