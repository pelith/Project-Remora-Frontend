import { useState, useEffect } from 'react';
import { useSetAtom, useAtomValue } from 'jotai';
import type { Vault } from '../types/vault.types';
import { updateVaultConfigAtom, isLoadingAtom } from '../stores/vault.store';
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
import { Switch } from '@/modules/common/components/ui/switch';
import { Separator } from '@/modules/common/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/modules/common/components/ui/radio-group';
import { Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
	Alert,
	AlertDescription,
} from '@/modules/common/components/ui/alert';
import { getMockPrice } from '../utils/vault-utils';

interface SettingsSheetProps {
	vault: Vault;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type RiskProfile = 'conservative' | 'standard' | 'aggressive' | 'custom';

export const SettingsSheet = ({
	vault,
	open,
	onOpenChange,
}: SettingsSheetProps) => {
	const updateVaultConfig = useSetAtom(updateVaultConfigAtom);
	const isLoading = useAtomValue(isLoadingAtom);

	// Local state
	const [riskProfile, setRiskProfile] = useState<RiskProfile>('custom');
	const [tickLower, setTickLower] = useState(
		vault.config.tickLower.toString(),
	);
	const [tickUpper, setTickUpper] = useState(
		vault.config.tickUpper.toString(),
	);
	const [swapAllowed, setSwapAllowed] = useState(vault.config.swapAllowed);
	const [maxPositions, setMaxPositions] = useState(vault.config.k.toString());
	// Local state to remember the last non-zero limit
	const [lastLimit, setLastLimit] = useState(
		vault.config.k > 0 ? vault.config.k.toString() : '5',
	);

	const currentPrice = getMockPrice(vault.poolKey.token0.symbol);

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
		return Math.round(((price / currentPrice - 1) * 10000));
	};

	const getRangeDisplay = (lower: number, upper: number) => {
		const p1 = getPriceFromTick(lower);
		const p2 = getPriceFromTick(upper);
		return `${formatPrice(p1)} - ${formatPrice(p2)}`;
	};

	// Reset local state when vault changes or sheet opens
	useEffect(() => {
		if (open) {
			const lower = vault.config.tickLower;
			const upper = vault.config.tickUpper;

			// Convert ticks to prices for display
			setTickLower(getPriceFromTick(lower).toFixed(2));
			setTickUpper(getPriceFromTick(upper).toFixed(2));

			setSwapAllowed(vault.config.swapAllowed);
			setMaxPositions(vault.config.k.toString());

			// Heuristic to detect profile
			if (lower === -1000 && upper === 1000) setRiskProfile('conservative');
			else if (lower === -2000 && upper === 2000)
				setRiskProfile('standard');
			else if (lower === -5000 && upper === 5000)
				setRiskProfile('aggressive');
			else setRiskProfile('custom');
		}
	}, [open, vault, currentPrice]);

	const handleProfileChange = (value: RiskProfile) => {
		setRiskProfile(value);

		// Set ticks based on profile (assuming mock ticks relative to 0)
		if (value === 'conservative') {
			setTickLower(getPriceFromTick(-1000).toFixed(2));
			setTickUpper(getPriceFromTick(1000).toFixed(2));
		} else if (value === 'standard') {
			setTickLower(getPriceFromTick(-2000).toFixed(2));
			setTickUpper(getPriceFromTick(2000).toFixed(2));
		} else if (value === 'aggressive') {
			setTickLower(getPriceFromTick(-5000).toFixed(2));
			setTickUpper(getPriceFromTick(5000).toFixed(2));
		}
		// 'custom' keeps current values or lets user edit
	};

	const handleManualTickChange = (
		setter: (val: string) => void,
		val: string,
	) => {
		setter(val);
		if (riskProfile !== 'custom') {
			setRiskProfile('custom');
		}
	};

	const handleSave = async () => {
		const k = parseInt(maxPositions);
		if (isNaN(k) || k < 0) {
			toast.error('Invalid Position Limit', {
				description: 'Max positions must be a positive number or 0.',
			});
			return;
		}

		try {
			// Convert price inputs back to ticks
			const tLower = getTickFromPrice(parseFloat(tickLower) || 0);
			const tUpper = getTickFromPrice(parseFloat(tickUpper) || 0);

			await updateVaultConfig(vault.id, {
				tickLower: tLower,
				tickUpper: tUpper,
				k,
				swapAllowed,
			});
			toast.success('Strategy Updated', {
				description: 'New settings will be applied to future rebalances.',
			});
			onOpenChange(false);
		} catch (e) {
			toast.error('Failed to update settings');
		}
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className='overflow-y-auto w-full sm:max-w-md'>
				<SheetHeader>
					<SheetTitle>Strategy Configuration</SheetTitle>
					<SheetDescription>
						Adjust how the AI Agent manages your liquidity positions.
					</SheetDescription>
				</SheetHeader>

				<div className='py-6 space-y-6'>
					{/* Section 1: Allowed Tick Range */}
					<div className='space-y-3'>
						<h4 className='text-sm font-medium text-primary uppercase tracking-wider flex items-center gap-2'>
							Price Range Strategy
						</h4>

						<Alert className='bg-primary/5 border-primary/20 mb-4'>
							<Info className='h-4 w-4 text-primary' />
							<AlertDescription className='text-xs text-text-secondary'>
								Changes to the price range will only affect{' '}
								<strong>newly created positions</strong>. Existing positions will
								remain active until they are closed or rebalanced.
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
									range: '±10% range',
									desc: getRangeDisplay(-1000, 1000),
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
									range: '±50% range',
									desc: getRangeDisplay(-5000, 5000),
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
										value={tickLower}
										onChange={(e) =>
											handleManualTickChange(setTickLower, e.target.value)
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
										value={tickUpper}
										onChange={(e) =>
											handleManualTickChange(setTickUpper, e.target.value)
										}
										placeholder={`e.g. ${formatPrice(currentPrice * 1.1).replace('$', '')}`}
										className='bg-background'
									/>
								</div>
							</div>
						</div>
					</div>

					<Separator className='bg-border-default/40' />

					{/* Section 2: Strategy Controls */}
					<div className='space-y-6'>
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
								checked={swapAllowed}
								onCheckedChange={setSwapAllowed}
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
					</div>
				</div>

				<SheetFooter>
					<Button
						className='w-full'
						onClick={handleSave}
						disabled={isLoading}
					>
						{isLoading ? (
							<Loader2 className='w-4 h-4 animate-spin' />
						) : (
							'Save Configuration'
						)}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
};

