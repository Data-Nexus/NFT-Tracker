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

		let transferEntity = new transfer(events.id(event))
		transferEntity.transaction 			= transactions.log(event).id
		transferEntity.token       			= token.id
		transferEntity.collection			= collection.id
		transferEntity.senderAddress        = senderAddress.id
		transferEntity.receiverAddress      = receiverAddress.id
		transferEntity.blockNumber 			= event.block.number
		transferEntity.amount 				= constants.BIGDECIMAL_ZERO
		transferEntity.save()

		let tx = transaction.load(event.transaction.hash.toHexString())
		if (tx != null) {
			
			let transferArray = tx.transfers 
			transferArray.push(transferEntity.id)
			
			let newTransferCount = tx.unmatchedTransferCount + 1 
			tx.unmatchedTransferCount = newTransferCount
			tx.transfers = transferArray 
			tx.save()
			
		}
	}

}
