type ConnectWalletViewProps = {
	address?: string;
	ethBalance?: string;
	usdcBalance?: string;
	isConnected: boolean;
	isSubmitting: boolean;
	recipient: string;
	amount: string;
	recipientError?: string;
	amountError?: string;
	onConnectClick: () => void;
	onChangeNetworkClick: () => void;
	onRecipientChange: (value: string) => void;
	onAmountChange: (value: string) => void;
	onSubmit: () => void;
};

export default function ConnectWalletView({
	address,
	ethBalance,
	usdcBalance,
	isConnected,
	isSubmitting,
	recipient,
	amount,
	recipientError,
	amountError,
	onConnectClick,
	onChangeNetworkClick,
	onRecipientChange,
	onAmountChange,
	onSubmit,
}: ConnectWalletViewProps) {
	return (
		<div className='min-h-screen bg-slate-950 text-white'>
			<div className='mx-auto w-full max-w-3xl px-6 py-10'>
				<h2 className='text-2xl font-semibold'>Connect Wallet</h2>
				<p className='mt-2 text-sm text-slate-300'>
					Simple wallet connection and balance view.
				</p>

				<div className='mt-6 flex flex-wrap gap-3'>
					<button
						type='button'
						onClick={onConnectClick}
						className='rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500'
					>
						Connect Wallet
					</button>
					<button
						type='button'
						onClick={onChangeNetworkClick}
						className='rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 hover:border-slate-500'
					>
						Change Network
					</button>
				</div>

				<div className='mt-8 grid gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4'>
					<div>
						<p className='text-xs text-slate-400'>Address</p>
						<p className='mt-1 text-sm'>
							{isConnected ? (address ?? '-') : 'Not connected'}
						</p>
					</div>
					<div className='grid gap-4 sm:grid-cols-2'>
						<div>
							<p className='text-xs text-slate-400'>ETH Balance</p>
							<p className='mt-1 text-sm'>
								{isConnected ? (ethBalance ?? '-') : '-'}
							</p>
						</div>
						<div>
							<p className='text-xs text-slate-400'>USDC Balance</p>
							<p className='mt-1 text-sm'>
								{isConnected ? (usdcBalance ?? '-') : '-'}
							</p>
						</div>
					</div>
				</div>

				<div className='mt-8 rounded-xl border border-slate-800 bg-slate-900/50 p-4'>
					<h3 className='text-lg font-semibold'>Send USDC</h3>
					<p className='mt-1 text-xs text-slate-400'>
						Send tokens to another wallet.
					</p>
					<form
						className='mt-4 grid gap-3'
						onSubmit={(event) => {
							event.preventDefault();
							onSubmit();
						}}
					>
						<label className='grid gap-2 text-sm'>
							<span className='text-slate-300'>Recipient</span>
							<input
								type='text'
								placeholder='0x...'
								className='rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100'
								disabled={!isConnected || isSubmitting}
								value={recipient}
								onChange={(event) => onRecipientChange(event.target.value)}
							/>
							{recipientError ? (
								<span className='text-xs text-rose-400'>{recipientError}</span>
							) : null}
						</label>
						<label className='grid gap-2 text-sm'>
							<span className='text-slate-300'>Amount</span>
							<input
								type='text'
								placeholder='0.0'
								className='rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100'
								disabled={!isConnected || isSubmitting}
								value={amount}
								onChange={(event) => onAmountChange(event.target.value)}
							/>
							{amountError ? (
								<span className='text-xs text-rose-400'>{amountError}</span>
							) : null}
						</label>
						<button
							type='submit'
							disabled={!isConnected || isSubmitting}
							className='rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-200'
						>
							{isSubmitting ? 'Sending...' : 'Send'}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}
