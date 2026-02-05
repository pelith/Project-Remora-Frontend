import { useState } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import type { CreateVaultFormData, Pool } from '../types/vault.types';
import { createVaultAtom, isLoadingAtom } from '../stores/vault.store';
import { MOCK_POOLS } from '../constants/mock-pools';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetFooter,
} from '@/modules/common/components/ui/sheet';
import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/modules/common/components/ui/radio-group';
import { Switch } from '@/modules/common/components/ui/switch';
import { Card } from '@/modules/common/components/ui/card';
import { Badge } from '@/modules/common/components/ui/badge';
import { Alert, AlertDescription } from '@/modules/common/components/ui/alert';
import { ChevronRight, Loader2, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getMockPrice } from '../utils/vault-utils';

interface CreateVaultSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const INITIAL_DATA: CreateVaultFormData = {
	selectedPool: null,
	riskProfile: 'standard',
	customRange: { min: '', max: '' },
	maxPositions: '5',
	swapAllowed: true,
	depositAmount: { token0: '', token1: '' },
};

export const CreateVaultSheet = ({
	open,
	onOpenChange,
}: CreateVaultSheetProps) => {
	const [step, setStep] = useState(1);
	const [formData, setFormData] = useState<CreateVaultFormData>(INITIAL_DATA);
	// Local state to remember the last non-zero limit
	const [lastLimit, setLastLimit] = useState('5');
	const createVault = useSetAtom(createVaultAtom);
	const isLoading = useAtomValue(isLoadingAtom);
	
	// Mock wallet connection for demo
	const isConnected = true;

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price);
	};

	const getPriceFromTick = (tick: number, basePrice: number) => {
		// Assuming mock ticks are BPS relative to current price (0 tick = current price)
		return basePrice * (1 + tick / 10000);
	};

	const getRangeDisplay = (
		lower: number,
		upper: number,
		basePrice: number,
	) => {
		const p1 = getPriceFromTick(lower, basePrice);
		const p2 = getPriceFromTick(upper, basePrice);
		return `${formatPrice(p1)} - ${formatPrice(p2)}`;
	};

	const getTickFromPrice = (price: number, basePrice: number) => {
		// Inverse of getPriceFromTick: tick = ((price / basePrice) - 1) * 10000
		if (basePrice === 0) return 0;
		return Math.round(((price / basePrice - 1) * 10000));
	};

	const handleNext = () => setStep((prev) => prev + 1);
	const handleBack = () => setStep((prev) => prev - 1);

	const handleCreate = async () => {
		try {
			// Convert price inputs to ticks if custom profile is selected
			const finalData = { ...formData };

			if (formData.riskProfile === 'custom') {
				const minPrice = parseFloat(formData.customRange.min);
				const maxPrice = parseFloat(formData.customRange.max);

				// Calculate ticks from prices
				if (!isNaN(minPrice) && !isNaN(maxPrice)) {
					const currentBasePrice = formData.selectedPool
						? getMockPrice(formData.selectedPool.token0.symbol)
						: 0;
					finalData.customRange = {
						min: getTickFromPrice(minPrice, currentBasePrice).toString(),
						max: getTickFromPrice(maxPrice, currentBasePrice).toString(),
					};
				}
			}

			await createVault(finalData);
			toast.success('Vault Created', {
				description: `${formData.selectedPool?.token0.symbol}/${formData.selectedPool?.token1.symbol} vault is ready.`,
			});
			onOpenChange(false);
			// Reset state after closing animation
			setTimeout(() => {
				setStep(1);
				setFormData(INITIAL_DATA);
			}, 300);
		} catch (error) {
			toast.error('Failed to create vault');
		}
	};

	const updateData = (updates: Partial<CreateVaultFormData>) => {
		setFormData((prev) => ({ ...prev, ...updates }));
	};

	const handleProfileChange = (
		value: 'conservative' | 'standard' | 'aggressive' | 'custom',
	) => {
		updateData({ riskProfile: value });
		// When changing predefined profiles, we clear custom inputs to avoid confusion
		if (value !== 'custom') {
			updateData({ customRange: { min: '', max: '' } });
		}
	};

	// Helper variables
	const token0 = formData.selectedPool?.token0;
	const token1 = formData.selectedPool?.token1;
	const isToken0Eth =
		token0?.symbol === 'ETH' ||
		token0?.symbol === 'WBTC' ||
		token0?.symbol === 'UNI';
	// Mock balances for demo - always have enough balance
	const avail0 = isToken0Eth ? '100.00' : '10000.00';
	const avail1 = isToken0Eth ? '10000.00' : '100.00';
	const currentBasePrice = token0 ? getMockPrice(token0.symbol) : 0;

	const getStepTitle = () => {
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
	};

	const isNextDisabled = () => {
		if (step === 1) return !formData.selectedPool;
		if (step === 3) {
			// Basic check: must deposit something
			const val0 = parseFloat(formData.depositAmount.token0);
			const val1 = parseFloat(formData.depositAmount.token1);
			return (
				(isNaN(val0) || val0 <= 0) && (isNaN(val1) || val1 <= 0)
			);
		}
		return false;
	};

	const renderContent = () => {
		switch (step) {
			case 1:
				return (
					<div className='space-y-4 py-4'>
						{MOCK_POOLS.map((pool) => (
							<Card
								key={pool.id}
								className={cn(
									'cursor-pointer p-4 transition-all hover:border-primary/50',
									formData.selectedPool?.id === pool.id
										? 'border-primary shadow-[0_0_15px_rgba(255,51,133,0.15)] bg-primary/5'
										: '',
								)}
								onClick={() => updateData({ selectedPool: pool })}
							>
								<div className='flex justify-between items-center'>
									<div className='flex items-center gap-3'>
										<div className='flex -space-x-2'>
											<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold z-10'>
												{pool.token0.symbol[0]}
											</div>
											<div className='w-8 h-8 rounded-full bg-surface-elevated border-2 border-surface flex items-center justify-center text-xs font-bold'>
												{pool.token1.symbol[0]}
											</div>
										</div>
										<div>
											<div className='font-semibold text-text-primary'>
												{pool.token0.symbol}/{pool.token1.symbol}
											</div>
											<div className='text-xs text-text-muted'>
												Fee: {(pool.fee / 10000).toFixed(2)}% • TVL: {pool.tvl}
											</div>
										</div>
									</div>
									{formData.selectedPool?.id === pool.id && (
										<div className='h-6 w-6 rounded-full bg-primary flex items-center justify-center'>
											<Check className='h-4 w-4 text-white' />
										</div>
									)}
								</div>
							</Card>
						))}
					</div>
				);

			case 2:
				return (
					<div className='space-y-6 py-4'>
						{/* Risk Profile Section */}
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
										val as
											| 'conservative'
											| 'standard'
											| 'aggressive'
											| 'custom',
									)
								}
								className='grid grid-cols-2 gap-4'
							>
								{[
									{
										value: 'conservative',
										label: 'Conservative',
										range: '±10% range',
										desc: getRangeDisplay(-1000, 1000, currentBasePrice),
									},
									{
										value: 'standard',
										label: 'Standard',
										range: '±20% range',
										desc: getRangeDisplay(-2000, 2000, currentBasePrice),
									},
									{
										value: 'aggressive',
										label: 'Aggressive',
										range: '±50% range',
										desc: getRangeDisplay(-5000, 5000, currentBasePrice),
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

						{/* Custom Range Inputs */}
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
									<Label>Min Price</Label>
									<Input
										type='number'
										placeholder={`e.g. ${formatPrice(currentBasePrice * 0.9).replace('$', '')}`}
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
									<Label>Max Price</Label>
									<Input
										type='number'
										placeholder={`e.g. ${formatPrice(currentBasePrice * 1.1).replace('$', '')}`}
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

							{/* Swap Allowed */}
							<div className='flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 shadow-[0_0_10px_rgba(255,51,133,0.05)] transition-all duration-200'>
								<div className='space-y-0.5'>
									<Label className='text-sm font-medium'>
										Auto-Swap Permission
									</Label>
									<p className='text-xs text-text-muted max-w-[250px]'>
										Allow the Agent to automatically swap tokens to maintain the
										target ratio during rebalancing.
									</p>
								</div>
								<Switch
									checked={formData.swapAllowed}
									onCheckedChange={(checked) =>
										updateData({ swapAllowed: checked })
									}
									className='data-[state=unchecked]:bg-slate-600'
								/>
							</div>

							{/* Max Positions (K) */}
							<div className='space-y-3'>
								<div className='flex items-center justify-between'>
									<Label htmlFor='max-positions'>
										Max Concurrent Positions (K)
									</Label>
									<div className='flex items-center gap-2'>
										<Label
											htmlFor='unlimited-positions'
											className='text-xs font-normal cursor-pointer text-white'
										>
											No Limit
										</Label>
										<Switch
											id='unlimited-positions'
											checked={formData.maxPositions === '0'}
											onCheckedChange={(checked) => {
												if (checked) {
													// Save current value before switching to unlimited
													if (formData.maxPositions !== '0') {
														setLastLimit(formData.maxPositions);
													}
													updateData({ maxPositions: '0' });
												} else {
													// Restore last value
													updateData({ maxPositions: lastLimit });
												}
											}}
											className='scale-75 data-[state=unchecked]:bg-slate-600'
										/>
									</div>
								</div>

								<div className='flex items-center gap-4'>
									<Input
										id='max-positions'
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

			case 3:
				if (!token0 || !token1) return null;
				return (
					<div className='space-y-6 py-4'>
						<div className='space-y-4'>
							<div className='space-y-2'>
								<div className='flex justify-between text-xs'>
									<Label>Deposit {token0.symbol}</Label>
									<span className='text-text-muted'>Available: {avail0}</span>
								</div>
								<div className='flex gap-2'>
									<Input
										type='number'
										placeholder='0.00'
										value={formData.depositAmount.token0}
										onChange={(e) =>
											updateData({
												depositAmount: {
													...formData.depositAmount,
													token0: e.target.value,
												},
											})
										}
									/>
									<Button
										variant='outline'
										onClick={() =>
											updateData({
												depositAmount: {
													...formData.depositAmount,
													token0: avail0.replace(/,/g, ''),
												},
											})
										}
									>
										Max
									</Button>
								</div>
							</div>

							<div className='space-y-2'>
								<div className='flex justify-between text-xs'>
									<Label>Deposit {token1.symbol}</Label>
									<span className='text-text-muted'>Available: {avail1}</span>
								</div>
								<div className='flex gap-2'>
									<Input
										type='number'
										placeholder='0.00'
										value={formData.depositAmount.token1}
										onChange={(e) =>
											updateData({
												depositAmount: {
													...formData.depositAmount,
													token1: e.target.value,
												},
											})
										}
									/>
									<Button
										variant='outline'
										onClick={() =>
											updateData({
												depositAmount: {
													...formData.depositAmount,
													token1: avail1.replace(/,/g, ''),
												},
											})
										}
									>
										Max
									</Button>
								</div>
							</div>
						</div>

						<div className='bg-primary/10 border border-primary/20 rounded-md p-3'>
							<p className='text-xs text-primary'>
								Note: Mock environment uses simplified balance checks. Ensure you
								don't exceed your mock wallet limits.
							</p>
						</div>
					</div>
				);

			case 4:
				return (
					<div className='space-y-6 py-4'>
						<div className='space-y-4'>
							<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider'>
								Pool
							</h4>
							<div className='flex items-center gap-2'>
								<span className='text-lg font-bold text-white'>
									{formData.selectedPool?.token0.symbol} /{' '}
									{formData.selectedPool?.token1.symbol}
								</span>
								<Badge variant='outline'>
									{(formData.selectedPool!.fee / 10000).toFixed(2)}%
								</Badge>
							</div>

							<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider mt-4'>
								Configuration
							</h4>
							<div className='grid grid-cols-2 gap-4 text-sm'>
								<div>
									<span className='text-text-muted'>Risk Profile:</span>
									<div className='font-medium capitalize'>
										{formData.riskProfile}
									</div>
								</div>
								<div>
									<span className='text-text-muted'>Max Positions:</span>
									<div className='font-medium'>
										{formData.maxPositions === '0'
											? 'Unlimited'
											: formData.maxPositions}
									</div>
								</div>
								<div>
									<span className='text-text-muted'>Swap Allowed:</span>
									<div className='font-medium'>
										{formData.swapAllowed ? 'Yes' : 'No'}
									</div>
								</div>
							</div>

							<h4 className='text-sm font-medium text-text-muted uppercase tracking-wider mt-4'>
								Initial Deposit
							</h4>
							<div className='space-y-1 text-sm'>
								<div className='flex justify-between'>
									<span>{formData.selectedPool?.token0.symbol}</span>
									<span className='font-mono'>
										{formData.depositAmount.token0}
									</span>
								</div>
								<div className='flex justify-between'>
									<span>{formData.selectedPool?.token1.symbol}</span>
									<span className='font-mono'>
										{formData.depositAmount.token1}
									</span>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='sm:max-w-[500px] bg-background border-l border-border-default overflow-y-auto'>
				<SheetHeader>
					<div className='flex items-center justify-between mb-2'>
						<SheetTitle>{getStepTitle()}</SheetTitle>
						<span className='text-xs text-text-muted'>Step {step} of 4</span>
					</div>
					<div className='h-1 w-full bg-surface-elevated rounded-full overflow-hidden'>
						<div
							className='h-full bg-primary transition-all duration-300 ease-out'
							style={{ width: `${(step / 4) * 100}%` }}
						/>
					</div>
					<SheetDescription>
						{step === 1 && 'Choose a liquidity pool for your new Vault.'}
						{step === 2 &&
							'Configure how the AI Agent manages your positions.'}
						{step === 3 && 'Deposit assets to initialize the Vault.'}
						{step === 4 && 'Review details and approve transaction.'}
					</SheetDescription>
				</SheetHeader>

				<div className='mt-4'>{renderContent()}</div>

				<SheetFooter className='absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border-default flex-row gap-3 sm:justify-between'>
					<Button
						variant='outline'
						onClick={handleBack}
						disabled={step === 1 || isLoading}
						className='w-1/3'
					>
						Back
					</Button>

					{step < 4 ? (
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
									Creating{' '}
									<Loader2 className='w-4 h-4 ml-2 animate-spin' />
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
};

