export interface Token {
	symbol: string;
	name: string;
	decimals: number;
}

export interface PoolKey {
	token0: Token;
	token1: Token;
	fee: number; // e.g. 500 for 0.05%
	id: string;
}

export interface Pool extends PoolKey {
	volume24h: string;
	tvl: string;
}

export type AgentStatus = 'active' | 'paused' | 'not-started';

export interface Position {
	id: string;
	tickLower: number;
	tickUpper: number;
	liquidityUSD: number;
	inRange: boolean;
}

export interface Vault {
	id: string;
	vaultAddress: string; // 0x...
	poolKey: PoolKey;
	totalValueUSD: number;
	createdAt: number;

	// Balances
	availableBalance: {
		token0: number;
		token1: number;
	};
	inPositions: {
		token0: number;
		token1: number;
	};

	// Agent Config
	agentStatus: AgentStatus;
	config: {
		tickLower: number;
		tickUpper: number;
		k: number; // 0 = unlimited
		swapAllowed: boolean;
	};

	// Positions
	positions: Position[];
}

export interface CreateVaultFormData {
	selectedPool: Pool | null;
	riskProfile: 'conservative' | 'standard' | 'aggressive' | 'custom';
	customRange: {
		min: string;
		max: string;
	};
	maxPositions: string; // "0" for unlimited
	swapAllowed: boolean;
	depositAmount: {
		token0: string;
		token1: string;
	};
}
