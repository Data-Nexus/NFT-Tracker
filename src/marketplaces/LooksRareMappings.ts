import {
	sale,
	transaction,
  currency,
} from '../../generated/schema'

import {
  MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
  TakerBid,
  TakerAsk,
} from '../../generated/LooksRare/LooksRare'

import {
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
      
      ERC20Contracts.getERC20(event.params.currency)
      let currencyEntity = currency.load(event.params.currency.toHexString())

      if (currencyEntity) {
        //Gather the decimals used in the currency transacted in
        let amountDecimals = 10 ** currencyEntity.decimals 

        //4. Assign currency address, amount, txId and platform to sale entity
        let saleEntity           = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
        saleEntity.transaction   = tx.id
        saleEntity.currency      = currencyEntity.id
        saleEntity.platform      = 'LooksRare'
        saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1000000000000000000')) 
        saleEntity.blockNumber   = event.block.number
        saleEntity.timestamp     = event.block.timestamp
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
              currencyEntity.symbol,            
            )
          }
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
      
        ERC20Contracts.getERC20(event.params.currency)
        let currencyEntity = currency.load(event.params.currency.toHexString())

        if (currencyEntity) { 
          //Gather the decimals used in the currency transacted in
          let amountDecimals = 10 ** currencyEntity.decimals 
          
          //4. Assign currency address, amount, txId and platform to sale entity
          let saleEntity           = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
          saleEntity.transaction   = tx.id
          saleEntity.currency      = currencyEntity.id
          saleEntity.platform      = 'LooksRare'
          saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1000000000000000000')) 
          saleEntity.blockNumber   = event.block.number
          saleEntity.timestamp     = event.block.timestamp
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
                currencyEntity.symbol,              
              )
            }
          }
        }
      }
    }
  }
  
  
  