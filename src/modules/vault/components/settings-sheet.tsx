import { Info, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/modules/common/components/ui/alert';
import { Button } from '@/modules/common/components/ui/button';
import { Input } from '@/modules/common/components/ui/input';
import { Label } from '@/modules/common/components/ui/label';
import {
	RadioGroup,
	RadioGroupItem,
} from '@/modules/common/components/ui/radio-group';
import { Separator } from '@/modules/common/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/modules/common/components/ui/sheet';
import { Switch } from '@/modules/common/components/ui/switch';
import { useSetMaxPositionsK } from '@/modules/contracts/hooks/use-set-max-position-k';
import { useSetSwapAllowed } from '@/modules/contracts/hooks/use-set-swap-allowed';
import { useSetVaultTickRange } from '@/modules/contracts/hooks/use-set-vault-tick-range';
import { useTokenPrice } from '@/modules/contracts/hooks/use-token-price';
import type { Vault } from '../types/vault.types';

interface SettingsSheetProps {
	vault: Vault;
	vaultAddress: string;
	trigger: React.ReactNode;
}

type RiskProfile = 'conservative' | 'standard' | 'aggressive' | 'custom';

export const SettingsSheet = ({
	vault,
	vaultAddress,
	trigger,
}: SettingsSheetProps) => {
	// Local state - store actual tick values, not prices
	const [riskProfile, setRiskProfile] = useState<RiskProfile>('custom');
	const [tickLower, setTickLower] = useState(vault.config.tickLower);
	const [tickUpper, setTickUpper] = useState(vault.config.tickUpper);
	const [swapAllowed, setSwapAllowed] = useState(vault.config.swapAllowed);
	const [maxPositions, setMaxPositions] = useState(vault.config.k.toString());

	const {
		setVaultTickRange: setVaultTickRangeFn,
		isPending: isPendingVaultTickRange,
	} = useSetVaultTickRange({ vaultAddress });
	const { setSwapAllowed: setSwapAllowedFn, isPending: isPendingSwapAllowed } =
		useSetSwapAllowed({ vaultAddress });
	const {
		setMaxPositionsK: setMaxPositionsKFn,
		isPending: isPendingMaxPositionsK,
	} = useSetMaxPositionsK({ vaultAddress });

	// Local state to remember the last non-zero limit
	const [lastLimit, setLastLimit] = useState(
		vault.config.k > 0 ? vault.config.k.toString() : '5',
	);

	const priceInfo = useTokenPrice({
		id: vault.poolKey.token0.symbol.toLowerCase(),
	});

	const currentPrice = priceInfo?.data?.price ?? 0;

	const formatPrice = (price: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0,
		}).format(price);
	};

	const getPriceFromTick = (tick: number) => {
		// Assuming mock ticks are BPS relative to current price (0 tick = current price)
		return currentPrice * (1 + tick / 10000);
	};

	const getTickFromPrice = (price: number) => {
		// Inverse of getPriceFromTick: tick = ((price / currentPrice) - 1) * 10000
		if (currentPrice === 0) return 0;
		return Math.round((price / currentPrice - 1) * 10000);
	};

	const getRangeDisplay = (lower: number, upper: number) => {
		const p1 = getPriceFromTick(lower);
		const p2 = getPriceFromTick(upper);
		return `${formatPrice(p1)} - ${formatPrice(p2)}`;
	};

	// Reset local state when vault changes or sheet opens
	function handleReset() {
		const lower = vault.config.tickLower;
		const upper = vault.config.tickUpper;

		// Store tick values directly
		setTickLower(lower);
		setTickUpper(upper);

		setSwapAllowed(vault.config.swapAllowed);
		setMaxPositions(vault.config.k.toString());

		// Heuristic to detect profile
		if (lower === -5000 && upper === 5000) setRiskProfile('conservative');
		else if (lower === -2000 && upper === 2000) setRiskProfile('standard');
		else if (lower === -1000 && upper === 1000) setRiskProfile('aggressive');
		else setRiskProfile('custom');
	}

	const handleProfileChange = (value: RiskProfile) => {
		setRiskProfile(value);

		// Set tick values directly based on profile
		if (value === 'conservative') {
			setTickLower(-5000);
			setTickUpper(5000);
		} else if (value === 'standard') {
			setTickLower(-2000);
			setTickUpper(2000);
		} else if (value === 'aggressive') {
			setTickLower(-1000);
			setTickUpper(1000);
		}
		// 'custom' keeps current values or lets user edit
	};

	const handleManualPriceChange = (isLower: boolean, priceStr: string) => {
		const price = Number.parseFloat(priceStr);
		if (!Number.isNaN(price)) {
			const tick = getTickFromPrice(price);
			if (isLower) {
				setTickLower(tick);
			} else {
				setTickUpper(tick);
			}
		}
		if (riskProfile !== 'custom') {
			setRiskProfile('custom');
		}
	};

	const handleSaveTickRange = async () => {
		try {
			await setVaultTickRangeFn(tickLower, tickUpper);
			toast.success('Price Range Updated', {
				description: 'New price range will apply to future positions.',
			});
		} catch (e) {
			console.error(e);
			toast.error('Failed to update price range');
		}
	};

	const handleSaveSwapAllowed = async () => {
		try {
			await setSwapAllowedFn(swapAllowed);
			toast.success('Auto-Swap Updated', {
				description: `Auto-swap is now ${swapAllowed ? 'enabled' : 'disabled'}.`,
			});
		} catch (e) {
			console.error(e);
			toast.error('Failed to update swap permission');
		}
	};

	const handleSaveMaxPositions = async () => {
		const k = Number.parseInt(maxPositions, 10);
		if (Number.isNaN(k) || k < 0) {
			toast.error('Invalid Position Limit', {
				description: 'Max positions must be a positive number or 0.',
			});
			return;
		}

		try {
			await setMaxPositionsKFn(BigInt(k));
			toast.success('Position Limit Updated', {
				description: `Max positions set to ${k === 0 ? 'unlimited' : k}.`,
			});
		} catch (e) {
			console.error(e);
			toast.error('Failed to update position limit');
		}
	};

	return (
		<Sheet
			onOpenChange={(open) => {
				if (!open) {
					handleReset();
				}
				return open;
			}}
		>
			<SheetTrigger asChild>{trigger}</SheetTrigger>
			<SheetContent className='overflow-y-auto w-full sm:max-w-md'>
				<SheetHeader>
					<SheetTitle>Strategy Configuration</SheetTitle>
					<SheetDescription>
						Adjust how the AI Agent manages your liquidity positions.
					</SheetDescription>
				</SheetHeader>

				<div className='py-6 space-y-8'>
					{/* Section 1: Allowed Tick Range */}
					<div className='space-y-4 p-4 rounded-lg border border-border-default/50 bg-background/50'>
						<div className='flex items-center justify-between'>
							<h4 className='text-sm font-medium text-primary uppercase tracking-wider'>
								Price Range Strategy
							</h4>
						</div>

						<Alert className='bg-primary/5 border-primary/20'>
							<Info className='h-4 w-4 text-primary' />
							<AlertDescription className='text-xs text-text-secondary'>
								Changes to the price range will only affect{' '}
								<strong>newly created positions</strong>. Existing positions
								will remain active until they are closed or rebalanced.
							</AlertDescription>
						</Alert>

						<RadioGroup
							value={riskProfile}
							onValueChange={(val: string) =>
								handleProfileChange(val as RiskProfile)
							}
							className='grid grid-cols-2 gap-4 mb-4'
						>
							{[
								{
									value: 'conservative',
									label: 'Conservative',
									range: '±50% range',
									desc: getRangeDisplay(-5000, 5000),
								},
								{
									value: 'standard',
									label: 'Standard',
									range: '±20% range',
									desc: getRangeDisplay(-2000, 2000),
								},
								{
									value: 'aggressive',
									label: 'Aggressive',
									range: '±10% range',
									desc: getRangeDisplay(-1000, 1000),
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
										id={`settings-${opt.value}`}
										className='peer sr-only'
									/>
									<Label
										htmlFor={`settings-${opt.value}`}
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

						<div
							className={cn(
								'transition-all duration-300 ease-in-out origin-top',
								riskProfile === 'custom'
									? 'opacity-100 max-h-[200px] mt-2 scale-100'
									: 'opacity-0 max-h-0 overflow-hidden mt-0 scale-95 pointer-events-none',
							)}
						>
							<div className='grid grid-cols-2 gap-4'>
								<div className='space-y-2'>
									<Label htmlFor='tick-lower'>Min Price</Label>
									<Input
										id='tick-lower'
										type='number'
										value={getPriceFromTick(tickLower).toFixed(2)}
										onChange={(e) =>
											handleManualPriceChange(true, e.target.value)
										}
										placeholder={`e.g. ${formatPrice(currentPrice * 0.9).replace('$', '')}`}
										className='bg-background'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='tick-upper'>Max Price</Label>
									<Input
										id='tick-upper'
										type='number'
										value={getPriceFromTick(tickUpper).toFixed(2)}
										onChange={(e) =>
											handleManualPriceChange(false, e.target.value)
										}
										placeholder={`e.g. ${formatPrice(currentPrice * 1.1).replace('$', '')}`}
										className='bg-background'
									/>
								</div>
							</div>
						</div>

						<Button
							className='w-full'
							onClick={handleSaveTickRange}
							disabled={
								isPendingVaultTickRange ||
								(tickLower === vault.config.tickLower &&
									tickUpper === vault.config.tickUpper)
							}
						>
							{isPendingVaultTickRange ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								'Update Price Range'
							)}
						</Button>
					</div>

					<Separator className='bg-border-default/40' />

					{/* Section 2: Auto-Swap Permission */}
					<div className='space-y-4 p-4 rounded-lg border border-border-default/50 bg-background/50'>
						<h4 className='text-sm font-medium text-primary uppercase tracking-wider'>
							Auto-Swap Permission
						</h4>

						<div className='flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5'>
							<div className='space-y-0.5 flex-1'>
								<Label className='text-sm font-medium'>Enable Auto-Swap</Label>
								<p className='text-xs text-text-muted max-w-[250px]'>
									Allow the Agent to automatically swap tokens to maintain the
									target ratio during rebalancing.
								</p>
							</div>
							<Switch
								checked={swapAllowed}
								onCheckedChange={setSwapAllowed}
								className='data-[state=unchecked]:bg-slate-600'
							/>
						</div>

						<Button
							className='w-full'
							onClick={handleSaveSwapAllowed}
							disabled={
								isPendingSwapAllowed || swapAllowed === vault.config.swapAllowed
							}
						>
							{isPendingSwapAllowed ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								'Update Auto-Swap Setting'
							)}
						</Button>
					</div>

					<Separator className='bg-border-default/40' />

					{/* Section 3: Max Positions */}
					<div className='space-y-4 p-4 rounded-lg border border-border-default/50 bg-background/50'>
						<h4 className='text-sm font-medium text-primary uppercase tracking-wider'>
							Position Limit
						</h4>

						<div className='space-y-3'>
							<div className='flex items-center justify-between'>
								<Label htmlFor='max-positions'>
									Max Concurrent Positions (K)
								</Label>
								<div className='flex items-center gap-2'>
									<Label
										htmlFor='settings-unlimited-positions'
										className='text-xs font-normal cursor-pointer text-white'
									>
										No Limit
									</Label>
									<Switch
										id='settings-unlimited-positions'
										checked={maxPositions === '0'}
										onCheckedChange={(checked) => {
											if (checked) {
												// Save current value before switching to unlimited
												if (maxPositions !== '0') {
													setLastLimit(maxPositions);
												}
												setMaxPositions('0');
											} else {
												// Restore previous value
												setMaxPositions(lastLimit);
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
									value={maxPositions === '0' ? lastLimit : maxPositions}
									onChange={(e) => {
										const val = e.target.value;
										setMaxPositions(val);
										setLastLimit(val);
									}}
									placeholder='e.g. 5'
									disabled={maxPositions === '0'}
									className='w-full'
								/>
							</div>

							<p className='text-xs text-text-muted flex items-center gap-1'>
								<Info className='w-3 h-3 inline' />
								Limits the number of active grid orders.
							</p>
						</div>

						<Button
							className='w-full'
							onClick={handleSaveMaxPositions}
							disabled={
								isPendingMaxPositionsK ||
								Number.parseInt(maxPositions, 10) === vault.config.k
							}
						>
							{isPendingMaxPositionsK ? (
								<Loader2 className='w-4 h-4 animate-spin' />
							) : (
								'Update Position Limit'
							)}
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
};
