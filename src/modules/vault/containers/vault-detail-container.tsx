import { useNavigate } from '@tanstack/react-router';
import { useAtomValue } from 'jotai';
import {
	ChevronLeft,
	Download,
	Pause,
	PieChart,
	Play,
	Settings,
	Trash2,
	Upload,
} from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { parseToBigNumber } from '@/modules/common/utils/bignumber';
import formatValueToStandardDisplay from '@/modules/common/utils/formatValueToStandardDisplay';
import {
	useVaultAvailableBalance,
	useVaultPositionsBalance,
} from '@/modules/contracts';
import {
	AgentControlDialog,
	DepositSheet,
	FullExitDialog,
	LiquidityDistributionChart,
	PositionsTable,
	SettingsSheet,
	WithdrawSheet,
} from '../components';
import { getVaultAtom } from '../stores/vault.store';
import { formatCurrency, getMockPrice } from '../utils/vault-utils';

interface VaultDetailContainerProps {
	vaultId: string;
}

export default function VaultDetailContainer({
	vaultId,
}: VaultDetailContainerProps) {
	const navigate = useNavigate();
	const getVault = useMemo(() => getVaultAtom(vaultId), [vaultId]);
	const vault = useAtomValue(getVault);
	const availableBalanceData = useVaultAvailableBalance({
		vaultAddress: vault?.vaultAddress ?? '',
		currency0: vault?.poolKey.token0.address as `0x${string}` | undefined,
		currency1: vault?.poolKey.token1.address as `0x${string}` | undefined,
	});
	const { data: positionsBalanceData } = useVaultPositionsBalance({
		vaultAddress: vault?.vaultAddress ?? '',
	});

	const [isDepositOpen, setIsDepositOpen] = useState(false);
	const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
	const [isFullExitOpen, setIsFullExitOpen] = useState(false);
	const [isAgentControlOpen, setIsAgentControlOpen] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [agentAction, setAgentAction] = useState<'start' | 'pause' | 'resume'>(
		'start',
	);
	const [withdrawDefaults, setWithdrawDefaults] = useState<
		| {
				token0: string;
				token1: string;
		  }
		| undefined
	>(undefined);

	if (!vault) {
		return (
			<Container className='py-8'>
				<div className='text-center py-20'>
					<h1 className='text-2xl font-bold text-text-primary mb-4'>
						Vault not found
					</h1>
					<Button onClick={() => navigate({ to: '/' })}>Back to Vaults</Button>
				</div>
			</Container>
		);
	}

	const availableBalance = availableBalanceData ?? vault.availableBalance;
	const inPositions = positionsBalanceData ?? vault.inPositions;

	const handleAgentControl = (action: 'start' | 'pause' | 'resume') => {
		setAgentAction(action);
		setIsAgentControlOpen(true);
	};

	const handleFullExitSuccess = () => {
		if (!availableBalance.currency0 || !availableBalance.currency1) return;
		// Calculate total expected balance after exit (Available + InPositions)
		const total0 = parseToBigNumber(
			availableBalance.currency0.balance ?? '0',
		).plus(inPositions.token0);
		const total1 = parseToBigNumber(
			availableBalance.currency1.balance ?? '0',
		).plus(inPositions.token1);

		setWithdrawDefaults({
			token0: total0.toString(),
			token1: total1.toString(),
		});
		setIsWithdrawOpen(true);
	};

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

	const currentPrice = getMockPrice(vault.poolKey.token0.symbol);

	return (
		<Container className='pt-4 pb-16 space-y-6 animate-in fade-in duration-500'>
			{/* Combined Header & KPI Section */}
			<div className='flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-border-default/40'>
				{/* Left: Identity & Status */}
				<div className='space-y-1'>
					<Button
						variant='ghost'
						className='pl-0 gap-1 text-white hover:text-primary -ml-2 h-auto py-0.5 mb-3 text-xs'
						onClick={() => navigate({ to: '/' })}
					>
						<ChevronLeft className='w-3 h-3' /> Back to Vaults
					</Button>

					<div className='flex items-center gap-3'>
						<h1 className='text-2xl font-bold flex items-center gap-2 text-text-primary tracking-tight'>
							{vault.poolKey.token0.symbol} / {vault.poolKey.token1.symbol}
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
						ID: <span className='text-text-muted'>{vault.id}</span>
					</div>
				</div>

				{/* Right: Key Performance Indicators */}
				<div className='flex flex-wrap items-center gap-x-6 gap-y-3'>
					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Current Price
						</div>
						<div className='text-lg font-bold text-text-primary'>
							{formatCurrency(currentPrice)}
						</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />

					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Total Value
						</div>
						<div className='text-lg font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'>
							{formatCurrency(vault.totalValueUSD)}
						</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />

					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Est. APR
						</div>
						<div className='text-lg font-bold text-success'>12.4%</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />

					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Fees (24h)
						</div>
						<div className='text-lg font-bold text-text-primary'>$245.80</div>
					</div>

					<div className='h-6 w-px bg-border-default/40 hidden sm:block' />

					<div className='space-y-0.5'>
						<div className='text-[10px] uppercase tracking-wider text-text-muted font-medium'>
							Last Rebalance
						</div>
						<div className='text-base font-medium text-text-secondary pt-0.5'>
							2h ago
						</div>
					</div>
				</div>
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-12 gap-4'>
				{/* Main Content Area - Left Side */}
				<div className='lg:col-span-8 space-y-4'>
					<LiquidityDistributionChart vault={vault} />
					<PositionsTable vault={vault} />
				</div>

				{/* Sidebar - Right Side */}
				<div className='lg:col-span-4 space-y-4'>
					{/* Action Center */}
					<Card className='border-border-default/50 bg-surface-card/80'>
						<CardContent className='p-3 space-y-2'>
							{/* Agent Control - Moved to top */}
							{vault.agentStatus === 'active' ? (
								<Button
									onClick={() => handleAgentControl('pause')}
									className='w-full h-10 border-warning/20 bg-warning/80 text-warning-foreground hover:bg-warning hover:border-warning/30 text-xs font-semibold shadow-md shadow-warning/10'
								>
									<Pause className='w-3.5 h-3.5 mr-2' /> Pause Agent
								</Button>
							) : (
								<Button
									onClick={() =>
										handleAgentControl(
											vault.agentStatus === 'paused' ? 'resume' : 'start',
										)
									}
									className={cn(
										'w-full h-10 text-xs font-semibold shadow-md',
										vault.agentStatus === 'not-started'
											? 'bg-success hover:bg-success/90 text-success-foreground shadow-success/10'
											: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/10',
									)}
								>
									<Play className='w-3.5 h-3.5 mr-2' />{' '}
									{vault.agentStatus === 'paused'
										? 'Resume Agent'
										: 'Start Agent'}
								</Button>
							)}

							<div className='grid grid-cols-2 gap-2'>
								<Button
									variant='secondary'
									onClick={() => setIsDepositOpen(true)}
									size='sm'
									className='w-full hover:bg-surface-elevated transition-all text-xs h-8 border border-border-default/50'
								>
									<Download className='w-3 h-3 mr-1.5' /> Deposit
								</Button>
								<Button
									variant='secondary'
									size='sm'
									onClick={() => {
										setWithdrawDefaults(undefined);
										setIsWithdrawOpen(true);
									}}
									className='w-full hover:bg-surface-elevated text-xs h-8 border border-border-default/50'
								>
									<Upload className='w-3 h-3 mr-1.5' /> Withdraw
								</Button>
							</div>

							<Button
								variant='ghost'
								size='sm'
								className='w-full border border-border-default text-text-muted hover:text-text-primary text-xs h-8'
								onClick={() => setIsSettingsOpen(true)}
							>
								<Settings className='w-3 h-3 mr-1.5' /> Configure Strategy
							</Button>

							<div className='pt-1'>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setIsFullExitOpen(true)}
									className='w-full text-error/80 hover:text-error hover:bg-error/10 border border-error/20 h-6 text-[10px]'
								>
									<Trash2 className='w-3 h-3 mr-1.5' /> Full Exit
								</Button>
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
											{inPositions.token0.toFixed(4)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vault.poolKey.token0.symbol}
										</span>
									</div>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{inPositions.token1.toFixed(2)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vault.poolKey.token1.symbol}
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
												availableBalance.currency0.balance ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vault.poolKey.token0.symbol}
										</span>
									</div>
									<div className='flex justify-between items-center text-xs'>
										<span className='font-mono text-text-primary'>
											{formatValueToStandardDisplay(
												availableBalance.currency1.balance ?? '0',
											)}
										</span>
										<span className='text-[10px] text-text-muted'>
											{vault.poolKey.token1.symbol}
										</span>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Dialogs & Sheets */}
			<DepositSheet
				vault={vault}
				open={isDepositOpen}
				onOpenChange={setIsDepositOpen}
			/>

			<WithdrawSheet
				vault={vault}
				open={isWithdrawOpen}
				onOpenChange={(open) => {
					setIsWithdrawOpen(open);
					if (!open) setWithdrawDefaults(undefined);
				}}
				defaultAmounts={withdrawDefaults}
			/>

			<FullExitDialog
				vault={vault}
				open={isFullExitOpen}
				onOpenChange={setIsFullExitOpen}
				onSuccess={handleFullExitSuccess}
			/>

			<AgentControlDialog
				vault={vault}
				action={agentAction}
				open={isAgentControlOpen}
				onOpenChange={setIsAgentControlOpen}
			/>

			<SettingsSheet
				vault={vault}
				open={isSettingsOpen}
				onOpenChange={setIsSettingsOpen}
			/>
		</Container>
	);
}
