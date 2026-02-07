import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import {
	ChevronLeft,
	Download,
	PieChart,
	Settings,
	Trash2,
	Upload,
} from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { type Address, isAddress, zeroAddress } from 'viem';
import { cn } from '@/lib/utils';
import { Container } from '@/modules/common/components/layout/container';
import { Badge } from '@/modules/common/components/ui/badge';
import { Button } from '@/modules/common/components/ui/button';
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from '@/modules/common/components/ui/card';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import { usePoolCurrentPrice } from '@/modules/contracts/hooks/use-pool-current-price';
import { useVault } from '@/modules/contracts/hooks/use-user-vault';
import { useVaultAssets } from '@/modules/contracts/hooks/use-vault-assets';
import {
	fetchPositionTokenAmounts,
	type PositionTokenAmountRequest,
} from '@/modules/contracts/services/position-token-amount-api';
import {
	AgentControlDialog,
	DepositSheet,
	FullExitDialog,
	LiquidityDistributionChart,
	PositionsTable,
	SettingsSheet,
	WithdrawSheet,
} from '../components';
import type { Vault } from '../types/vault.types';
import { formatCurrency } from '../utils/vault-utils';

interface VaultDetailContainerProps {
	vaultId: string;
}

// Hoisted static function - Rule 5.3
const getAgentStatusColor = (status: string) => {
	switch (status) {
		case 'active':
			return 'bg-primary/20 text-primary border-primary/40 shadow-[0_0_10px_rgba(255,51,133,0.3)] animate-pulse';
		case 'paused':
			return 'bg-warning/20 text-warning border-warning/40';
		default:
			return 'bg-text-muted/20 text-text-muted border-text-muted/40';
	}
};

export default function VaultDetailContainer({
	vaultId,
}: VaultDetailContainerProps) {
	const navigate = useNavigate();

	// vaultId should be a chain address (0x...)
	const vaultAddress = vaultId;
	const isVaultAddress = isAddress(vaultAddress);

	// Get vault data from chain (hooks must be called before any conditional returns)
	const onChainVault = useVault({ vaultAddress });
	const vaultAssets = useVaultAssets({ vaultAddress });

	// Fetch positions from API
	const positionAmountsQuery = useQuery({
		queryKey: ['position-token-amounts', vaultAddress],
		queryFn: () =>
			fetchPositionTokenAmounts({
				vaultAddress,
			} as PositionTokenAmountRequest),
		enabled: isVaultAddress,
		staleTime: 30_000, // 30 seconds
	});

	// Construct vault object from real chain data (must be before conditional returns)
	// Rule 4.1: Calculate derived state during rendering - narrow dependencies
	const vault = useMemo((): Vault | undefined => {
		if (!onChainVault.data || !vaultAssets.data) return undefined;

		return {
			id: vaultId,
			vaultAddress,
			poolKey: {
				token0: {
					symbol: vaultAssets.data.token0?.symbol ?? '',
					name: vaultAssets.data.token0?.symbol ?? '',
					decimals: vaultAssets.data.token0?.decimals ?? 18,
					address: onChainVault.data.currency0 ?? '',
				},
				token1: {
					symbol: vaultAssets.data.token1?.symbol ?? '',
					name: vaultAssets.data.token1?.symbol ?? '',
					decimals: vaultAssets.data.token1?.decimals ?? 18,
					address: onChainVault.data.currency1 ?? '',
				},
				fee: onChainVault.data.fee ?? 0,
				id: onChainVault.data.poolId ?? '',
			},
			totalValueUSD:
				Number.parseFloat(vaultAssets.data.totalValueUSD ?? '0') || 0,
			createdAt: Date.now(),
			availableBalance: {
				token0:
					Number.parseFloat(vaultAssets.data.token0?.idleAmount ?? '0') || 0,
				token1:
					Number.parseFloat(vaultAssets.data.token1?.idleAmount ?? '0') || 0,
			},
			inPositions: {
				token0:
					Number.parseFloat(vaultAssets.data.token0?.positionAmount ?? '0') ||
					0,
				token1:
					Number.parseFloat(vaultAssets.data.token1?.positionAmount ?? '0') ||
					0,
			},
			agentStatus:
				onChainVault.data.agentPaused === 'paused' ? 'paused' : 'active',
			config: {
				tickLower: onChainVault.data.allowedTickLower ?? 0,
				tickUpper: onChainVault.data.allowedTickUpper ?? 0,
				k: onChainVault.data.maxPositionsKRaw
					? Number(onChainVault.data.maxPositionsKRaw)
					: 0,
				swapAllowed: onChainVault.data.swapAllowed ?? false,
			},
			positions: [],
		};
	}, [vaultId, vaultAddress, onChainVault.data, vaultAssets.data]);

	// Rule 4.1: Derive currentPrice during rendering instead of computing inline
	const { data: poolCurrentPriceInfo } = usePoolCurrentPrice({
		poolKey: vault?.poolKey
			? {
					currency0: vault?.poolKey.token0.address as Address,
					currency1: vault?.poolKey.token1.address as Address,
					fee: vault?.poolKey.fee ?? 0,
					tickSpacing: 60,
					hooks: zeroAddress,
				}
			: undefined,
		token0Decimals: vault?.poolKey.token0.decimals ?? 18,
		token1Decimals: vault?.poolKey.token1.decimals ?? 18,
		chainId: 1,
	});

	const currentPrice = poolCurrentPriceInfo?.rawPrice;

	console.log('currentPrice', poolCurrentPriceInfo);

	// Rule 4.7: Put interaction logic in event handlers with useCallback

	// Rule 4.7: Memoize navigation handlers
	const handleBackToVaults = useCallback(() => {
		navigate({ to: '/' });
	}, [navigate]);

	// Check if vault address is valid
	if (!isVaultAddress) {
		return (
			<Container className='py-8'>
				<div className='text-center py-20'>
					<h1 className='text-2xl font-bold text-text-primary mb-4'>
						Invalid vault address
					</h1>
					<Button onClick={handleBackToVaults}>Back to Vaults</Button>
				</div>
			</Container>
		);
	}

	// Show loading state if data is not ready
	if (!vault) {
		return (
			<Container className='py-8'>
				<div className='text-center py-20'>
					<p className='text-text-muted'>
						{onChainVault.isLoading || vaultAssets.isLoading
							? 'Loading vault...'
							: 'Vault data not available'}
					</p>
				</div>
			</Container>
		);
	}

	return (
		<Container className='pt-4 pb-16 space-y-6 animate-in fade-in duration-500'>
			{/* Combined Header & KPI Section */}
			<div className='flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border-default/40'>
				{/* Left: Identity & Status */}
				<div className='space-y-1'>
					<Button
						variant='ghost'
						className='pl-0 gap-1 text-white hover:text-primary -ml-2 h-auto py-0.5 mb-3 text-xs'
						onClick={handleBackToVaults}
					>
						<ChevronLeft className='w-3 h-3' /> Back to Vaults
					</Button>

					<div className='flex items-center gap-3'>
						<h1 className='text-2xl font-bold flex items-center gap-2 text-text-primary tracking-tight'>
							{vaultAssets.data?.token0?.symbol ?? ''} /{' '}
							{vaultAssets.data?.token1?.symbol ?? ''}
						</h1>
						<Badge
							variant='outline'
							className='font-mono text-[10px] font-normal text-text-muted border-border-default bg-surface-elevated/50'
						>
							{(vault.poolKey.fee / 10000).toFixed(2)}%
						</Badge>
						<Badge
							className={cn(
								'capitalize px-2 py-0.5 text-[10px] tracking-wide font-medium',
								getAgentStatusColor(vault.agentStatus),
							)}
						>
							{vault.agentStatus.replace('-', ' ')}
						</Badge>
					</div>
					<div className='text-[10px] font-mono text-text-muted/60 flex items-center gap-2'>
						ID: <span className='text-text-muted'>{vaultAddress}</span>
					</div>
				</div>

				{/* Right: Key Performance Indicators */}
				<div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Current Price
						</div>
						<div className='text-lg font-bold text-text-primary'>
							{formatValueToStandardDisplay(currentPrice ?? 0)}
						</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />

					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Total Value
						</div>
						<div className='text-lg font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'>
							{vaultAssets.isLoading
								? '-'
								: formatCurrency(
										Number(vaultAssets.data?.totalValueUSD ?? '0'),
									)}
						</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
				{/* Main Content Area - Left Side */}
				<div className='lg:col-span-8 space-y-4'>
					<LiquidityDistributionChart vault={vault} />
					<PositionsTable
						positions={positionAmountsQuery.data?.positions ?? []}
						vaultAssets={vaultAssets.data}
					/>
				</div>

				{/* Sidebar - Right Side */}
				<div className='lg:col-span-4 space-y-4'>
					{/* Action Center */}
					<Card className='border-border-default/50 bg-surface-card/80'>
						<CardContent className='p-3 space-y-2'>
							{/* Agent Control - Moved to top */}
							{/* Rule 5.8: Use explicit conditional rendering */}

							<AgentControlDialog
								vaultAddress={vaultAddress}
								vaultConfigK={vault.config.k}
								vaultConfigTickLower={vault.config.tickLower}
								vaultConfigTickUpper={vault.config.tickUpper}
								vaultSwapAllowed={vault.config.swapAllowed}
								vaultPoolKeyToken0Symbol={vault.poolKey.token0.symbol}
								vaultPoolKeyToken1Symbol={vault.poolKey.token1.symbol}
							/>

							<div className='grid grid-cols-2 gap-2'>
								<DepositSheet
									vaultAddress={vaultAddress}
									token0Address={vault.poolKey.token0.address ?? ''}
									token1Address={vault.poolKey.token1.address ?? ''}
									trigger={
										<Button
											variant='secondary'
											size='sm'
											className='w-full hover:bg-surface-elevated transition-all text-xs h-8 border border-border-default/50'
										>
											<Download className='w-3 h-3 mr-1.5' /> Deposit
										</Button>
									}
								/>

								<WithdrawSheet
									vaultAddress={vaultAddress}
									token0Address={onChainVault.data?.currency0 ?? ''}
									token1Address={onChainVault.data?.currency1 ?? ''}
									trigger={
										<Button
											variant='secondary'
											size='sm'
											className='w-full hover:bg-surface-elevated text-xs h-8 border border-border-default/50'
										>
											<Upload className='w-3 h-3 mr-1.5' /> Withdraw
										</Button>
									}
								/>
							</div>

							<SettingsSheet
								vault={vault}
								vaultAddress={vaultAddress}
								trigger={
									<Button
										variant='ghost'
										size='sm'
										className='w-full border border-border-default text-text-muted hover:text-text-primary text-xs h-8'
									>
										<Settings className='w-3 h-3 mr-1.5' /> Configure Strategy
									</Button>
								}
							/>

							<div className='pt-1'>
								<FullExitDialog
									vaultAddress={vaultAddress}
									trigger={
										<Button
											variant='ghost'
											size='sm'
											className='w-full text-error/80 hover:text-error hover:bg-error/10 border border-error/20 h-6 text-[10px]'
										>
											<Trash2 className='w-3 h-3 mr-1.5' /> Full Exit
										</Button>
									}
								/>
							</div>
						</CardContent>
					</Card>

					{/* Balance Breakdown */}
					<Card className='border-border-default/50 bg-surface-card/50'>
						<CardHeader className='pb-2 pt-4 px-4 border-b border-border-default/40'>
							<CardTitle className='text-sm font-medium flex items-center gap-2'>
								<PieChart className='w-3.5 h-3.5 text-text-secondary' />{' '}
								Liquidity Breakdown
							</CardTitle>
						</CardHeader>
						<CardContent className='p-3 space-y-3'>
							<div>
								<div className='flex justify-between items-center mb-1'>
									<span className='text-[10px] text-text-muted uppercase tracking-wider font-medium'>
										In Positions
									</span>
									<Badge variant='secondary' className='text-[9px] h-4 px-1'>
										deployed
									</Badge>
								</div>
								<div className='space-y-1 bg-surface-elevated/30 p-2 rounded-md border border-border-default/30'>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{formatValueToStandardDisplay(
												vaultAssets.data?.token0?.positionAmount ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vaultAssets.data?.token0?.symbol ?? ''}
										</span>
									</div>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{formatValueToStandardDisplay(
												vaultAssets.data?.token1?.positionAmount ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vaultAssets.data?.token1?.symbol ?? ''}
										</span>
									</div>
								</div>
							</div>

							<div>
								<div className='flex justify-between items-center mb-1'>
									<span className='text-[10px] text-text-muted uppercase tracking-wider font-medium'>
										Idle Balance
									</span>
									<Badge
										variant='outline'
										className='text-[9px] h-4 px-1 border-dashed'
									>
										available
									</Badge>
								</div>
								<div className='space-y-1 bg-surface-elevated/30 p-2 rounded-md border border-border-default/30'>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{formatValueToStandardDisplay(
												vaultAssets.data?.token0?.idleAmount ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vaultAssets.data?.token0?.symbol ?? ''}
										</span>
									</div>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{formatValueToStandardDisplay(
												vaultAssets.data?.token1?.idleAmount ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vaultAssets.data?.token1?.symbol ?? ''}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Dialogs & Sheets */}
		</Container>
	);
}
