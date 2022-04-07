import {
	Account,
	Transfer,
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
	
	let registry = fetchRegistry(event.address)
	if (registry != null)
	{
		let token = fetchToken(registry, event.params.tokenId)
		
		
		let from  = Account.load(event.params.from.toHex())
		if (!from) {
			from = new Account(event.params.from.toHex())
		}
		
		let to  = Account.load(event.params.to.toHex())
		if (!to) {
			to = new Account(event.params.to.toHex())
		}		

		token.owner = to.id

		registry.save()
		token.save()
		from.save()
		to.save()

		let ev = new Transfer(events.id(event))
		ev.transaction = transactions.log(event).id
		ev.timestamp   = event.block.timestamp
		ev.token       = token.id
		ev.from        = from.id
		ev.to          = to.id
		ev.save()
	}

}
