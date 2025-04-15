import Link from "next/link";

const MkCodeCredit = () => (
	<small className='m-1 opacity-30 select-none fixed bottom-0 right-0 max-sm:text-center max-sm:w-full'>
		<Link target='_blank' href={'https://mkcode.org'}>
			@ mkcode
		</Link>
	</small>
)

export default MkCodeCredit