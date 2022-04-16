import {
	sale,
    collection,
    token,
	transfer,
	transaction,
} from '../../generated/schema'

import {
    MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
	OrdersMatched,
} from '../../generated/OpenseaV1/OpenSeaV1'

import {
	constants,
} from '../../src/graphprotocol-utils'

import { 
    BigDecimal, 
} from "@graphprotocol/graph-ts"

// TakerAsk Handler starts here
export function handleOSv1Sale(event: OrdersMatched): void {
  
  //1. load transaction
  let tx = transaction.load(event.transaction.hash.toHexString()) 
  
  //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) if it doesn't exist should we error or skip?  
  if (tx != null && event.transaction.value != constants.BIGINT_ZERO) {
    
    //3. create new sale entity (id = tx hash - eventId)  
    let saleEntity = sale.load(tx.id + '-' + event.logIndex.toString())
    if (saleEntity == null) {
    
      //4. Assign currency address, amount, txId and platform to sale entity
      let saleEntity = new sale(tx.id + '-' + event.logIndex.toString())
      saleEntity.transaction   = tx.id
      saleEntity.currency      = 'ETH'

      //Amount to adjust to params.price once we have a solution for multi-currency
      saleEntity.amount        = event.transaction.value.divDecimal(BigDecimal.fromString('1000000000000000000')) 
      saleEntity.platform      = 'OpenSea'
      
    
      //5. Assign sale.amount / transaction.unmatchedTransferCount to variable transferAmount to pass into transfer entities 
      // This will derives the amount per transfer (eg each nft's amount in a bundle with 2 NFT's is the total price divided by 2.)
      let transferAmount       = saleEntity.amount.div(BigDecimal.fromString(tx.unmatchedTransferCount.toString()))  
      
      //6. Using unmatchedTransferId loop through the transfer entities and apply the transferAmount and assign saleId , 
      //reducing the unmatchedTransferCount by 1 and removing the id from transaction.unmatchedTransferEventId. save transfer update on each loop.
      MatchTransferWithSale(
          tx.transfers, //string is not a string[]
          transferAmount
      )

      //7. Save sale and save transaction
      saleEntity.save()

      //8. Update daily/weekly/monthly metrics 
  
    }
  }

  //else log.error('OpenSeaV1 Mapping errored from transaction: ' + event.transaction.hash.toHexString(), [])

}


