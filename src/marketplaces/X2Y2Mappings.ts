import {
	sale,
	transaction,
} from '../../generated/schema'

import {
  MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
  EvProfit
} from '../../generated/X2Y2/X2Y2'

import { 
  BigDecimal
} from "@graphprotocol/graph-ts"

// TakerBid Handler starts here
export function handleEvProfit(event: EvProfit): void {
  
  //1. load transaction
  let tx = transaction.load(event.transaction.hash.toHexString())
  
  //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) if it doesn't exist should we error or skip?  
  //&& event.transaction.value != constants.BIGINT_ZERO && event.params.buyHash != ) {
  if (tx){
    
    let i32variable: i32 = parseInt('777')
    //3. create new sale entity (id = tx hash - eventId)  
    let saleEntity = sale.load(event.block.number.toString() + '-' + event.logIndex.toString())
    if (!saleEntity && tx.unmatchedTransferCount > 0) {
        
      let currencyAddress = event.params.currency.toString()
      let currency =  'ERC20'
      if (currencyAddress = '0x0000000000000000000000000000000000000000') {currency = 'ETH'}
      if (currencyAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {currency = 'WETH'}
      
      //4. Assign currency address, amount, txId and platform to sale entity
      let saleEntity = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
      saleEntity.transaction   = tx.id
      saleEntity.currency      = currency
      saleEntity.platform      = 'X2Y2'
      //X2Y2 emites the profit amount instead of the total price, added / 0.98 to get the full sale price
      saleEntity.amount        = event.params.amount.divDecimal(BigDecimal.fromString('1000000000000000000')).div(BigDecimal.fromString('0.98')) 
      saleEntity.save()
      
      //5. Assign sale.amount / transaction.unmatchedTransferCount to variable transferAmount to pass into transfer entities 
      // This will derives the amount per transfer (eg each nft's amount in a bundle with 2 NFT's is the total price divided by 2.)
      let transferAmount      = saleEntity.amount.div(BigDecimal.fromString(tx.unmatchedTransferCount.toString()))  
      
      //6. Using unmatchedTransferId loop through the transfer entities and apply the transferAmount and assign saleId , 
      //reducing the unmatchedTransferCount by 1. save transfer update on each loop.
      if(tx.transfers && transferAmount && tx.id && saleEntity.id) {
                
        let array = tx.transfers
        for (let index = 0; index < array.length; index++) {

          let trId = array[index]            

          MatchTransferWithSale(
            trId, 
            transferAmount,
            tx.id,
            saleEntity.id,
          )

        }
      }
    }
  }
}