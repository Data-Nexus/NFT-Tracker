import {
	account,
	transfer,
	transaction,
} from '../../generated/schema'

import {
	Transfer       as TransferEvent,
} from '../../generated/IERC721/IERC721'

import {
	fetchRegistry,
	fetchToken,
} from '../utils/erc721'

import {
	constants,
	events,
	transactions,
} from '../../src/graphprotocol-utils'

import { 
	log 
} from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
	
	let collection = fetchRegistry(event.address)
	if (collection != null)
	{
		let token = fetchToken(collection, event.params.tokenId)
		
		
		let senderAddress  = account.load(event.params.from.toHexString())
		if (!senderAddress) {
			senderAddress = new account(event.params.from.toHexString())
		}
		
		let receiverAddress  = account.load(event.params.to.toHexString())
		if (!receiverAddress) {
			receiverAddress = new account(event.params.to.toHexString())
		}		

		token.owner = receiverAddress.id

		collection.save()
		token.save()
		senderAddress.save()
		receiverAddress.save()

		let ev = new transfer(events.id(event))
		ev.transaction 			= transactions.log(event).id
		ev.token       			= token.id
		ev.tokenId     			= token.id	//added for testing
		ev.collection			= collection.id
		ev.senderAddress        = senderAddress.id
		ev.receiverAddress      = receiverAddress.id
		ev.amount 				= constants.BIGDECIMAL_ZERO
		ev.save()

		let tx = transaction.load(event.transaction.hash.toHexString())
		if (tx != null) {
			
			let array = tx.transfers 
			array.push(ev.id)
			
			let newTransferCount = tx.unmatchedTransferCount + 1 
			tx.unmatchedTransferCount = newTransferCount
			tx.transfers = array 
			tx.save()
			
		}
	}

}
