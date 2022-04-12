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
	events,
	transactions,
} from '../../src/graphprotocol-utils'

import { 
	log 
} from '@graphprotocol/graph-ts';

export function handleTransfer(event: TransferEvent): void {
	log.info('transaction: ' + event.transaction.hash.toHexString(), []);
	
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
		ev.save()

		let tx = transaction.load(event.transaction.hash.toHexString())
		if (tx != null) {
			
			let newTransferNum = tx.unmatchedTransfersEventNum + 1 
			
			//add event id to array to later identify transfer event if/when sale occurs
			let newTransferArray = tx.unmatchedTransferEventId
			if (newTransferArray == null) {
				newTransferArray = event.logIndex.toString()
			} 
			else {newTransferArray = tx.unmatchedTransferEventId + ',' + event.logIndex.toString()}

			tx.unmatchedTransfersEventNum = newTransferNum
			tx.unmatchedTransferEventId = newTransferArray
			tx.save()
			
		}
	}

}
