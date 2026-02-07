import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/modules/common/components/ui/alert';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import {
	RadioGroup,
	RadioGroupItem,
} from '@/modules/common/components/ui/radio-group';
import { Switch } from '@/modules/common/components/ui/switch';
import { useCreateVaultContext } from '../../contexts/create-vault-context';
import { useTokenPrice } from '@/modules/contracts/hooks/use-token-price';

export function CreateVaultStep2Container() {
	const {
		formData,
		lastLimit,
		updateData,
		setLastLimit,
		handleProfileChange,
		formatPrice,
	} = useCreateVaultContext();

	const token0 = formData.selectedPool?.token0;
	const token1 = formData.selectedPool?.token1;

	// 獲取兩個 token 的價格
	const { data: token0PriceData } = useTokenPrice({
		id: token0?.symbol?.toLowerCase() ?? '',
		vsCurrency: 'usd',
	});
	const { data: token1PriceData } = useTokenPrice({
		id: token1?.symbol?.toLowerCase() ?? '',
		vsCurrency: 'usd',
	});

	const token0Price = token0PriceData?.price ?? 1;
	const token1Price = token1PriceData?.price ?? 1;

	// 判斷哪個是報價 token (通常是價格較高的)
	// 在 Uniswap 中，價格通常表示為 token1/token0 的比率
	// 但我們要顯示的是用戶更關心的那個 token 的價格範圍
	const isToken0Base = token0Price > token1Price;
	const baseTokenPrice = isToken0Base ? token0Price : token1Price;
	const baseTokenSymbol = isToken0Base ? token0?.symbol : token1?.symbol;

	// 計算價格範圍顯示
	const getPriceRangeDisplay = (percentage: number) => {
		const minPrice = baseTokenPrice * (1 - percentage);
		const maxPrice = baseTokenPrice * (1 + percentage);
		return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
	};

	return (
		<div className='space-y-6 py-4'>
			<div className='space-y-3'>
				<h4 className='text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2'>
					Price Range Strategy
				</h4>

				<Alert className='bg-primary/5 border-primary/20 mb-4 py-2 px-3'>
					<Info className='h-4 w-4 text-primary' />
					<AlertDescription className='text-xs text-text-secondary ml-2'>
						The Agent uses this price range to determine where to place grid
						orders.
					</AlertDescription>
				</Alert>

				<RadioGroup
					value={formData.riskProfile}
					onValueChange={(val: string) =>
						handleProfileChange(
							val as 'conservative' | 'standard' | 'aggressive' | 'custom',
						)
					}
					className='grid grid-cols-2 gap-4'
				>
					{[
						{
							value: 'conservative',
							label: 'Conservative',
							range: '±50% range',
							desc: getPriceRangeDisplay(0.5),
						},
						{
							value: 'standard',
							label: 'Standard',
							range: '±20% range',
							desc: getPriceRangeDisplay(0.2),
						},
						{
							value: 'aggressive',
							label: 'Aggressive',
							range: '±10% range',
							desc: getPriceRangeDisplay(0.1),
						},
						{
							value: 'custom',
							label: 'Custom',
							range: 'Manual set',
							desc: 'Custom price range',
						},
					].map((opt) => (
						<div key={opt.value}>
							<RadioGroupItem
								value={opt.value}
								id={`create-${opt.value}`}
								className='peer sr-only'
							/>
							<Label
								htmlFor={`create-${opt.value}`}
								className='flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full text-center transition-all shadow-sm hover:shadow-md'
							>
								<span className='font-semibold text-sm'>{opt.label}</span>
								<span className='text-[10px] text-primary/80 font-mono mt-1'>
									{opt.range}
								</span>
								<span className='text-[10px] text-text-muted mt-0.5'>
									{opt.desc}
								</span>
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>

			<div
				className={cn(
					'transition-all duration-300 ease-in-out origin-top',
					formData.riskProfile === 'custom'
						? 'opacity-100 max-h-[200px] mt-2 scale-100'
						: 'opacity-0 max-h-0 overflow-hidden mt-0 scale-95 pointer-events-none',
				)}
			>
				<div className='grid grid-cols-2 gap-4'>
					<div className='space-y-2'>
						<Label>Min Price ({baseTokenSymbol || 'Token'} in USD)</Label>
						<Input
							type='number'
							step='0.01'
							placeholder={`e.g. ${formatPrice(baseTokenPrice * 0.9).replace('$', '')}`}
							value={formData.customRange.min}
							onChange={(e) =>
								updateData({
									customRange: {
										...formData.customRange,
										min: e.target.value,
									},
								})
							}
							className='bg-background'
						/>
					</div>
					<div className='space-y-2'>
						<Label>Max Price ({baseTokenSymbol || 'Token'} in USD)</Label>
						<Input
							type='number'
							step='0.01'
							placeholder={`e.g. ${formatPrice(baseTokenPrice * 1.1).replace('$', '')}`}
							value={formData.customRange.max}
							onChange={(e) =>
								updateData({
									customRange: {
										...formData.customRange,
										max: e.target.value,
									},
								})
							}
							className='bg-background'
						/>
					</div>
				</div>
			</div>

			<div className='space-y-4'>
				<h4 className='text-sm font-medium text-primary uppercase tracking-wider'>
					Operational Limits
				</h4>

				<div className='flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-[0_0_10px_rgba(255,51,133,0.05)] transition-all duration-200'>
					<div className='space-y-0.5'>
						<Label className='text-sm font-medium'>Auto-Swap Permission</Label>
						<p className='text-xs text-text-muted max-w-[250px]'>
							Allow the Agent to automatically swap tokens to maintain the
							target ratio during rebalancing.
						</p>
					</div>
					<Switch
						checked={formData.swapAllowed}
						onCheckedChange={(checked) => updateData({ swapAllowed: checked })}
						className='data-[state=unchecked]:bg-slate-600'
					/>
				</div>

				<div className='space-y-3'>
					<div className='flex items-center justify-between'>
						<Label htmlFor='max-positions'>Max Concurrent Positions (K)</Label>
						<div className='flex items-center gap-2'>
							<Label
								htmlFor='unlimited-positions'
								className='text-xs font-normal cursor-pointer text-white'
							>
								No Limit
							</Label>
							<Switch
								checked={formData.maxPositions === '0'}
								onCheckedChange={(checked) => {
									if (checked) {
										if (formData.maxPositions !== '0') {
											setLastLimit(formData.maxPositions);
										}
										updateData({ maxPositions: '0' });
									} else {
										updateData({ maxPositions: lastLimit });
									}
								}}
								className='scale-75 data-[state=unchecked]:bg-slate-600'
							/>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						<Input
							type='number'
							min='1'
							value={
								formData.maxPositions === '0'
									? lastLimit
									: formData.maxPositions
							}
							onChange={(e) => {
								const val = e.target.value;
								updateData({ maxPositions: val });
								setLastLimit(val);
							}}
							placeholder='e.g. 5'
							disabled={formData.maxPositions === '0'}
							className='w-full'
						/>
					</div>

					<p className='text-xs text-text-muted flex items-center gap-1'>
						<Info className='w-3 h-3 inline' />
						Limits the number of active grid orders.
					</p>
				</div>
			</div>
		</div>
	);
}
