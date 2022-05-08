import {
	account,
	transfer,
	transaction,
	accountCollection,
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

import { store } from '@graphprotocol/graph-ts'

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
		
		let senderAccountCollection = accountCollection.load(senderAddress.id + '-' + collection.id)
		if (senderAccountCollection && senderAddress.id != "0x0000000000000000000000000000000000000000") {

			let senderTokenCountNew = senderAccountCollection.tokenCount - 1
			senderAccountCollection.tokenCount 	 = senderTokenCountNew
			senderAccountCollection.save()

			if(senderAccountCollection.tokenCount == 0) {store.remove("accountCollection",senderAddress.id + '-' + collection.id)}
		}

		let receiverAccountCollection = accountCollection.load(receiverAddress.id + '-' + collection.id)
		if (receiverAccountCollection && receiverAddress.id != "0x0000000000000000000000000000000000000000") {

			let receiverTokenCountNew = receiverAccountCollection.tokenCount + 1

			receiverAccountCollection.tokenCount = receiverTokenCountNew
			receiverAccountCollection.save()	
			
		}
		if (!receiverAccountCollection && receiverAddress.id != "0x0000000000000000000000000000000000000000") {
			
			receiverAccountCollection 			 = new accountCollection(receiverAddress.id + '-' + collection.id)
			receiverAccountCollection.account 	 = receiverAddress.id 
			receiverAccountCollection.collection = collection.id
			receiverAccountCollection.tokenCount = 1 

			receiverAccountCollection.save()	
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
		transferEntity.blockNumber 			= event.block.number.toI32()
        transferEntity.timestamp     		= event.block.timestamp.toI32()
		transferEntity.amount 				= constants.BIGDECIMAL_ZERO
		transferEntity.save()

		let tx = transaction.load(event.transaction.hash.toHexString())
		if (tx != null 
			&& transferEntity.senderAddress != '0x83c8f28c26bf6aaca652df1dbbe0e1b56f8baba2' //Gem.xyz Aggregator
			&& transferEntity.senderAddress != '0x0a267cf51ef038fc00e71801f5a524aec06e4f07' //Genie Aggregator
			) {
			
			let transferArray = tx.transfers 
			transferArray.push(transferEntity.id)
			
			let newTransferCount = tx.unmatchedTransferCount + 1 
			tx.unmatchedTransferCount = newTransferCount
			tx.transfers = transferArray 
			tx.save()
			
		}

	}

}
