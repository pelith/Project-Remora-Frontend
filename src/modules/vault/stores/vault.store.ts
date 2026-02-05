import { atom } from 'jotai';
import type { CreateVaultFormData, Vault } from '../types/vault.types';
import {
	calculateInitialTVL,
	generateMockPositions,
	getMockPrice,
} from '../utils/vault-utils';
// Generate realistic mock vaults with market-aligned positions
function generateMockVaults(): Vault[] {
	const now = Date.now();

	// Vault 1: ETH/USDC pool
	const ethPrice = getMockPrice('ETH');
	const vault1InvestedUSD = 100000; // 80% of 125K
	const vault1Positions = generateMockPositions(
		vault1InvestedUSD,
		5, // k = 5
		ethPrice,
	);
	const vault1TotalInPositions = vault1Positions.reduce(
		(sum, p) => sum + p.liquidityUSD,
		0,
	);

	// Vault 2: WBTC/ETH pool
	const wbtcPrice = getMockPrice('WBTC');
	const vault2InvestedUSD = 68000; // 80% of 85K
	const vault2Positions = generateMockPositions(
		vault2InvestedUSD,
		3, // k = 3
		wbtcPrice,
	);
	const vault2TotalInPositions = vault2Positions.reduce(
		(sum, p) => sum + p.liquidityUSD,
		0,
	);

	return [
		{
			id: 'vault-demo-1',
			vaultAddress: '0x1234567890123456789012345678901234567890',
			poolKey: {
				token0: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
				token1: { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
				fee: 500,
				id: 'pool-1',
			},
			totalValueUSD: 125000,
			createdAt: now - 86400000,
			agentStatus: 'active',
			availableBalance: {
				token0: 10.5,
				token1: 25000,
			},
			inPositions: {
				token0: (vault1TotalInPositions / ethPrice) * 0.4,
				token1: vault1TotalInPositions * 0.6,
			},
			config: {
				tickLower: -2000,
				tickUpper: 2000,
				k: 5,
				swapAllowed: true,
			},
			positions: vault1Positions,
		},
		{
			id: 'vault-demo-2',
			vaultAddress: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
			poolKey: {
				token0: { symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8 },
				token1: { symbol: 'ETH', name: 'Ethereum', decimals: 18 },
				fee: 500,
				id: 'pool-2',
			},
			totalValueUSD: 85000,
			createdAt: now - 172800000,
			agentStatus: 'paused',
			availableBalance: {
				token0: 1.2,
				token1: 15.0,
			},
			inPositions: {
				token0: (vault2TotalInPositions / wbtcPrice) * 0.5,
				token1: (vault2TotalInPositions / ethPrice) * 0.5,
			},
			config: {
				tickLower: -1000,
				tickUpper: 1000,
				k: 3,
				swapAllowed: false,
			},
			positions: vault2Positions,
		},
	];
}

const mockVaults: Vault[] = generateMockVaults();

export const vaultsAtom = atom<Vault[]>(mockVaults);
export const isLoadingAtom = atom(false);

// Helper function to update vault
function updateVault(
	vaults: Vault[],
	vaultId: string,
	updater: (vault: Vault) => Vault,
): Vault[] {
	return vaults.map((v) => (v.id === vaultId ? updater(v) : v));
}

// Action atoms
export const createVaultAtom = atom(
	null,
	async (_get, set, data: CreateVaultFormData) => {
		if (!data.selectedPool) return;
		set(isLoadingAtom, true);
		await new Promise((resolve) => setTimeout(resolve, 1500));

		try {
			let initialTickLower = 0;
			let initialTickUpper = 0;

			// Determine initial tick range based on risk profile
			if (data.riskProfile === 'conservative') {
				initialTickLower = -500;
				initialTickUpper = 500;
			} else if (data.riskProfile === 'standard') {
				initialTickLower = -1000;
				initialTickUpper = 1000;
			} else if (data.riskProfile === 'aggressive') {
				initialTickLower = -2000;
				initialTickUpper = 2000;
			} else {
				// Custom
				initialTickLower = data.customRange.min
					? Number.parseFloat(data.customRange.min)
					: 0;
				initialTickUpper = data.customRange.max
					? Number.parseFloat(data.customRange.max)
					: 0;
			}

			const newVault: Vault = {
				id: `vault-${Date.now()}`,
				vaultAddress: `0x${Math.random().toString(16).slice(2, 42)}`,
				poolKey: {
					token0: data.selectedPool.token0,
					token1: data.selectedPool.token1,
					fee: data.selectedPool.fee,
					id: data.selectedPool.id,
				},
				totalValueUSD: calculateInitialTVL(
					data.depositAmount.token0,
					data.depositAmount.token1,
					data.selectedPool,
				),
				createdAt: Date.now(),
				agentStatus: 'not-started',
				availableBalance: {
					token0: Number.parseFloat(data.depositAmount.token0) || 0,
					token1: Number.parseFloat(data.depositAmount.token1) || 0,
				},
				inPositions: { token0: 0, token1: 0 },
				config: {
					tickLower: initialTickLower,
					tickUpper: initialTickUpper,
					k: Number.parseInt(data.maxPositions, 10) || 0,
					swapAllowed: data.swapAllowed,
				},
				positions: [],
			};

			set(vaultsAtom, (prev) => [newVault, ...prev]);
		} catch (error) {
			console.error(error);
			throw error;
		} finally {
			set(isLoadingAtom, false);
		}
	},
);

export const depositAtom = atom(
	null,
	async (get, set, vaultId: string, amount0: string, amount1: string) => {
		set(isLoadingAtom, true);
		await new Promise((resolve) => setTimeout(resolve, 800));

		set(
			vaultsAtom,
			updateVault(get(vaultsAtom), vaultId, (v) => {
				const add0 = Number.parseFloat(amount0) || 0;
				const add1 = Number.parseFloat(amount1) || 0;

				const newBalance = {
					token0: v.availableBalance.token0 + add0,
					token1: v.availableBalance.token1 + add1,
				};

				const price0 = getMockPrice(v.poolKey.token0.symbol);
				const price1 = getMockPrice(v.poolKey.token1.symbol);

				const valueInPositions = v.positions.reduce(
					(acc, pos) => acc + pos.liquidityUSD,
					0,
				);
				const valueAvailable =
					newBalance.token0 * price0 + newBalance.token1 * price1;

				return {
					...v,
					availableBalance: newBalance,
					totalValueUSD: valueInPositions + valueAvailable,
				};
			}),
		);

		set(isLoadingAtom, false);
	},
);

export const withdrawAtom = atom(
	null,
	async (get, set, vaultId: string, amount0: string, amount1: string) => {
		set(isLoadingAtom, true);
		await new Promise((resolve) => setTimeout(resolve, 800));

		set(
			vaultsAtom,
			updateVault(get(vaultsAtom), vaultId, (v) => {
				const sub0 = Number.parseFloat(amount0) || 0;
				const sub1 = Number.parseFloat(amount1) || 0;

				const newBalance = {
					token0: Math.max(0, v.availableBalance.token0 - sub0),
					token1: Math.max(0, v.availableBalance.token1 - sub1),
				};

				const price0 = getMockPrice(v.poolKey.token0.symbol);
				const price1 = getMockPrice(v.poolKey.token1.symbol);
				const valueInPositions = v.positions.reduce(
					(acc, pos) => acc + pos.liquidityUSD,
					0,
				);
				const valueAvailable =
					newBalance.token0 * price0 + newBalance.token1 * price1;

				return {
					...v,
					availableBalance: newBalance,
					totalValueUSD: valueInPositions + valueAvailable,
				};
			}),
		);

		set(isLoadingAtom, false);
	},
);

export const startAgentAtom = atom(null, async (get, set, vaultId: string) => {
	set(isLoadingAtom, true);
	await new Promise((resolve) => setTimeout(resolve, 1000));

	set(
		vaultsAtom,
		updateVault(get(vaultsAtom), vaultId, (v) => {
			// Move 80% of available funds to positions
			const move0 = v.availableBalance.token0 * 0.8;
			const move1 = v.availableBalance.token1 * 0.8;

			const newAvailable = {
				token0: v.availableBalance.token0 - move0,
				token1: v.availableBalance.token1 - move1,
			};

			const newInPositions = {
				token0: v.inPositions.token0 + move0,
				token1: v.inPositions.token1 + move1,
			};

			const price0 = getMockPrice(v.poolKey.token0.symbol);
			const price1 = getMockPrice(v.poolKey.token1.symbol);
			const investedUSD = move0 * price0 + move1 * price1;
			const currentPrice = price0; // Use token0 price as reference

			// Generate positions aligned with market liquidity peaks
			const positions = generateMockPositions(
				investedUSD,
				v.config.k,
				currentPrice,
			);

			return {
				...v,
				agentStatus: 'active',
				availableBalance: newAvailable,
				inPositions: newInPositions,
				positions,
			};
		}),
	);

	set(isLoadingAtom, false);
});

export const pauseAgentAtom = atom(null, async (get, set, vaultId: string) => {
	set(isLoadingAtom, true);
	await new Promise((resolve) => setTimeout(resolve, 500));

	set(
		vaultsAtom,
		updateVault(get(vaultsAtom), vaultId, (v) => ({
			...v,
			agentStatus: 'paused',
		})),
	);

	set(isLoadingAtom, false);
});

export const resumeAgentAtom = atom(null, async (get, set, vaultId: string) => {
	set(isLoadingAtom, true);
	await new Promise((resolve) => setTimeout(resolve, 500));

	set(
		vaultsAtom,
		updateVault(get(vaultsAtom), vaultId, (v) => ({
			...v,
			agentStatus: 'active',
		})),
	);

	set(isLoadingAtom, false);
});

export const fullExitAtom = atom(null, async (get, set, vaultId: string) => {
	set(isLoadingAtom, true);
	await new Promise((resolve) => setTimeout(resolve, 1000));

	set(
		vaultsAtom,
		updateVault(get(vaultsAtom), vaultId, (v) => {
			const newAvailable = {
				token0: v.availableBalance.token0 + v.inPositions.token0,
				token1: v.availableBalance.token1 + v.inPositions.token1,
			};

			return {
				...v,
				agentStatus: 'not-started',
				positions: [],
				inPositions: { token0: 0, token1: 0 },
				availableBalance: newAvailable,
			};
		}),
	);

	set(isLoadingAtom, false);
});

export const updateVaultConfigAtom = atom(
	null,
	async (
		get,
		set,
		vaultId: string,
		config: {
			tickLower: number;
			tickUpper: number;
			k: number;
			swapAllowed: boolean;
		},
	) => {
		set(isLoadingAtom, true);
		await new Promise((resolve) => setTimeout(resolve, 800));

		set(
			vaultsAtom,
			updateVault(get(vaultsAtom), vaultId, (v) => ({
				...v,
				config: {
					...v.config,
					...config,
				},
			})),
		);

		set(isLoadingAtom, false);
	},
);

// Derived atoms
export const getVaultAtom = (id: string) =>
	atom((get) => get(vaultsAtom).find((v) => v.id === id));
