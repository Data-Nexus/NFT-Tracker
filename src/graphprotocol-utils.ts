import { 
    BigDecimal, 
    BigInt,
    ethereum,
} from '@graphprotocol/graph-ts'

import {
	Transaction,
} from '../generated/schema'


export namespace events {
	export function id(event: ethereum.Event): string {
		return event.block.number.toString().concat('-').concat(event.logIndex.toString())
	}
}


export namespace constants {
	export let   BIGINT_ZERO      = BigInt.fromI32(0)
	export let   BIGINT_ONE       = BigInt.fromI32(1)
	export let   BIGDECIMAL_ZERO  = new BigDecimal(constants.BIGINT_ZERO)
	export let   BIGDECIMAL_ONE   = new BigDecimal(constants.BIGINT_ONE)
	export const ADDRESS_ZERO     = '0x0000000000000000000000000000000000000000'
	export const BYTES32_ZERO     = '0x0000000000000000000000000000000000000000000000000000000000000000'
}

export namespace transactions {
	export function log(event: ethereum.Event): Transaction {
		let tx = new Transaction(event.transaction.hash.toHex())
		tx.timestamp   = event.block.timestamp
		tx.blockNumber = event.block.number
		tx.save()
		return tx as Transaction
	}
	export type Tx = Transaction
}