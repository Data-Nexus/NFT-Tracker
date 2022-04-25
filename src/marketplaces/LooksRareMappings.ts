import {
	sale,
	transaction,
} from '../../generated/schema'

import {
  MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
  TakerBid,
  TakerAsk,
} from '../../generated/LooksRare/LooksRare'

import {
	constants,
  ERC20Contracts,
} from '../../src/graphprotocol-utils'

import { 
  BigDecimal
} from "@graphprotocol/graph-ts"

// TakerBid Handler starts here
export function handleTakerBid(event: TakerBid): void {
  
  //1. load transaction
  let tx = transaction.load(event.transaction.hash.toHexString())
  
  //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) if it doesn't exist should we error or skip?  
  //&& event.transaction.value != constants.BIGINT_ZERO && event.params.buyHash != ) {
  if (tx){

    //3. create new sale entity (id = tx hash - eventId)  
    let saleEntity = sale.load(event.block.number.toString() + '-' + event.logIndex.toString())
    if (!saleEntity && tx.unmatchedTransferCount > 0) {
      
      //test to see if we start logging currencies
      ERC20Contracts.getERC20(event.params.currency)
      
      let currencyAddress = event.params.currency.toString()
      let currency =  'ERC20'
      if (currencyAddress = '0x0000000000000000000000000000000000000000') {currency = 'ETH'}
      if (currencyAddress = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2') {currency = 'WETH'}

      //4. Assign currency address, amount, txId and platform to sale entity
      let saleEntity = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
      saleEntity.transaction   = tx.id
      saleEntity.currency      = currency
      saleEntity.platform      = 'LooksRare'
      saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1000000000000000000')) 
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


// TakerAsk Handler starts here (logic is the same)
export function handleTakerAsk(event: TakerAsk): void {
  
    //1. load transaction
    let tx = transaction.load(event.transaction.hash.toHexString())
    
    //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) if it doesn't exist should we error or skip?  
    //&& event.transaction.value != constants.BIGINT_ZERO && event.params.buyHash != ) {
    if (tx){
  
      //3. create new sale entity (id = tx hash - eventId)  
      let saleEntity = sale.load(event.block.number.toString() + '-' + event.logIndex.toString())
      if (!saleEntity && tx.unmatchedTransferCount > 0) {
      
        let currency = 'WETH'
        if (event.transaction.value != constants.BIGINT_ZERO) {currency = 'ETH'}
  
        //4. Assign currency address, amount, txId and platform to sale entity
        let saleEntity = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
        saleEntity.transaction   = tx.id
        saleEntity.currency      = currency
        saleEntity.platform      = 'LooksRare'
        saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1000000000000000000')) 
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
  
  
  