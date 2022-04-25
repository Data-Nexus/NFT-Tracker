import { Bytes } from '@graphprotocol/graph-ts'
import { 
    BigDecimal, 
    BigInt,
    ethereum,
} from '@graphprotocol/graph-ts'

import { ERC20 } from '../generated/IERC721/ERC20'

import {
	currency,
	transaction,
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
	export function log(event: ethereum.Event): transaction {
		
		let tx = transaction.load(event.transaction.hash.toHexString())
		if (!tx) {
			
			tx = new transaction(event.transaction.hash.toHexString())
			tx.timestamp   = event.block.timestamp
			tx.blockNumber = event.block.number
        	tx.unmatchedTransferCount = 0
			tx.gasPrice = event.transaction.gasPrice
			tx.transactionFrom = event.transaction.from
			tx.transfers = new Array<string>()
			tx.save()
			}

		return tx as transaction
	}
	export type Tx = transaction
}

export namespace ERC20Contracts {
	export function getERC20 (address: Bytes): currency {

		let currencyEntity = currency.load(address)
		if (!currencyEntity) {

			let ERC20Var = ERC20.bind(address)

			currencyEntity = new currency(address)
			currencyEntity.symbol 	= ERC20Var.symbol()
			currencyEntity.name 	= ERC20Var.name()
			currencyEntity.decimals = ERC20Var.decimals()
			currencyEntity.save()
		}

		return currencyEntity as currency
	}

}
