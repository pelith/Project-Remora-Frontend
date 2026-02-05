import { atom } from 'jotai';
import type {
	CreateVaultFormData,
	Position,
	Vault,
} from '../types/vault.types';
import {
	calculateInitialTVL,
	generateMockPositions,
	getMockPrice,
} from '../utils/vault-utils';

export const vaultsAtom = atom<Vault[]>([]);
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
	async (get, set, data: CreateVaultFormData) => {
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
					? parseFloat(data.customRange.min)
					: 0;
				initialTickUpper = data.customRange.max
					? parseFloat(data.customRange.max)
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
					token0: parseFloat(data.depositAmount.token0) || 0,
					token1: parseFloat(data.depositAmount.token1) || 0,
				},
				inPositions: { token0: 0, token1: 0 },
				config: {
					tickLower: initialTickLower,
					tickUpper: initialTickUpper,
					k: parseInt(data.maxPositions) || 0,
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
				const add0 = parseFloat(amount0) || 0;
				const add1 = parseFloat(amount1) || 0;

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
				const sub0 = parseFloat(amount0) || 0;
				const sub1 = parseFloat(amount1) || 0;

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

export const startAgentAtom = atom(
	null,
	async (get, set, vaultId: string) => {
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

				// Pass the configured K (max positions) to the generator
				const positions = generateMockPositions(investedUSD, v.config.k);

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
	},
);

export const pauseAgentAtom = atom(
	null,
	async (get, set, vaultId: string) => {
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
	},
);

export const resumeAgentAtom = atom(
	null,
	async (get, set, vaultId: string) => {
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
	},
);

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

