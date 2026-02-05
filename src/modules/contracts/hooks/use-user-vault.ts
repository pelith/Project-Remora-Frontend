import { type Address, isAddress } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';
import { V4_AGENTIC_VAULT_FACTORY_ABI } from '@/modules/contracts/constants/v4-agentic-vault-factory-abi';
import { V4_AGENTIC_VAULT_ABI } from '../constants/v4-agentic-vault-abi';
import { getResult } from '../utils';
import useAppWriteContract from './use-app-write-contract';

interface UseUserVaultProps {
	address: `0x${string}`;
}

const mockV4VaultAddress = '0x1234567890123456789012345678901234567890';

export function useUserVaultsIds({ address }: UseUserVaultProps) {
	const result = useReadContract({
		address: mockV4VaultAddress,
		abi: V4_AGENTIC_VAULT_FACTORY_ABI,
		functionName: 'getVaultsCreatedBy',
		args: [address],
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
					maxPositionsK: getResult(maxPositionsK),
					positionsLength: getResult(positionsLength),
					posm: getResult(posm),
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

	return {
		...result,
		createVault(args: {
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
			return mutateAsync({
				address: mockV4VaultAddress,
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
		},
	};
}
