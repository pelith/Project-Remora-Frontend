import type BigNumber from 'bignumber.js';
import { ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { erc20Abi, parseUnits, zeroAddress } from 'viem';
import { useSendTransaction } from 'wagmi';
import { parseToBigNumber } from '@/modules/common/utils/bignumber';
import { getEtherscanLink, shortenTxId } from '../utils';
import useAppWriteContract from './use-app-write-contract';

export function useSendTokenToVault(
	vaultAddress: string,
	tokenAddress: string,
	amount: BigNumber.Value,
) {
	const isNative = tokenAddress.toLowerCase() === zeroAddress;
	const { writeContractAsync, isPending } = useAppWriteContract();
	const { mutateAsync: sendTransaction, isPending: isSendingTransaction } =
		useSendTransaction({
			mutation: {
				onSuccess(hash) {
					toast(
						<a
							target='_blank'
							href={getEtherscanLink(1, hash, 'transaction')}
							rel='noreferrer noopener'
							className='text-decoration-none text-gray-800'
						>
							{shortenTxId(hash)} <ExternalLink size={16} />
						</a>,
					);
				},
				onError(error) {
					toast.error(<div>{error.message}</div>);
				},
			},
		});

	return {
		send: async () => {
			if (isNative) {
				await sendTransaction({
					to: vaultAddress as `0x${string}`,
					value: parseUnits(parseToBigNumber(amount).toString(), 18),
				});
			} else {
				await writeContractAsync({
					address: tokenAddress as `0x${string}`,
					abi: erc20Abi,
					functionName: 'transfer',
					args: [
						vaultAddress as `0x${string}`,
						parseUnits(parseToBigNumber(amount).toString(), 18),
					],
				});
			}
		},
		isLoading: isPending || isSendingTransaction,
	};
}
