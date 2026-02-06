import { type Address, isAddress } from 'viem';
import { usePublicClient, useReadContract, useReadContracts } from 'wagmi';
import { V4_AGENTIC_VAULT_FACTORY_ABI } from '@/modules/contracts/constants/v4-agentic-vault-factory-abi';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import { VAULT_FACTORY_ADDRESS } from '../constants/vault-address';
import { getResult } from '../utils';
import useAppWriteContract from './use-app-write-contract';

interface UseUserVaultProps {
	address: string;
}

export function useUserVaultsIds({ address }: UseUserVaultProps) {
	const result = useReadContract({
		address: VAULT_FACTORY_ADDRESS,
		abi: V4_AGENTIC_VAULT_FACTORY_ABI,
		functionName: 'getVaultsCreatedBy',
		args: [address as `0x${string}`],
		query: {
			select: (data) => data ?? [],
		},
	});

	return result;
}

export function useVault({ vaultAddress }: { vaultAddress: string }) {
	const _result = useReadContracts({
		contracts: [
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'currency0',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'currency1',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'fee',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'tickSpacing',
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'poolId',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'allowedTickLower',
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'allowedTickUpper',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'swapAllowed',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'maxPositionsK',
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'positionsLength',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'posm',
				args: [],
			},
			{
				abi: V4_AGENTIC_VAULT_ABI,
				address: vaultAddress as Address,
				functionName: 'agentPaused',
			},
		],
		query: {
			enabled: isAddress(vaultAddress),
			select(data) {
				const [
					currency0,
					currency1,
					fee,
					tickSpacing,
					poolId,
					allowedTickLower,
					allowedTickUpper,
					swapAllowed,
					maxPositionsK,
					positionsLength,
					posm,
					agentPaused,
				] = data;
				return {
					currency0: getResult(currency0),
					currency1: getResult(currency1),
					fee: getResult(fee),
					tickSpacing: getResult(tickSpacing),
					poolId: getResult(poolId),
					allowedTickLower: getResult(allowedTickLower),
					allowedTickUpper: getResult(allowedTickUpper),
					swapAllowed: getResult(swapAllowed),
					maxPositionsKRaw: getResult(maxPositionsK)?.toString(),
					positionsLengthRaw: getResult(positionsLength)?.toString(),
					posm: getResult(posm),
					agentPaused: getResult(agentPaused) === true ? 'active' : 'paused',
				};
			},
		},
	});

	return _result;
}

/**
 * Create Vault detail from api.
 */
export function useCreateVault() {
	const { mutateAsync, ...result } = useAppWriteContract();
	const publicClient = usePublicClient();

	return {
		...result,
		async createVault(args: {
			poolKey: {
				currency0: `0x${string}`;
				currency1: `0x${string}`;
				fee: number;
				tickSpacing: number;
				hooks: `0x${string}`;
			};
			agent: `0x${string}`;
			allowedTickLower: number;
			allowedTickUpper: number;
			swapAllowed: boolean;
			maxPositionsK: bigint;
		}) {
			const hash = await mutateAsync({
				address: VAULT_FACTORY_ADDRESS,
				abi: V4_AGENTIC_VAULT_FACTORY_ABI,
				functionName: 'createVault',
				args: [
					args.poolKey,
					args.agent,
					args.allowedTickLower,
					args.allowedTickUpper,
					args.swapAllowed,
					args.maxPositionsK,
				],
			});

			await publicClient?.waitForTransactionReceipt({ hash });

			return hash;
		},
	};
}
