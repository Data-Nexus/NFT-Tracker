import {
	sale,
	transaction,
  currency,
  wethTransaction,
} from '../../generated/schema'

import {
  MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
  OrdersMatched,
} from '../../generated/OpenseaV1/OpenSeaV1'

import {
	constants, ERC20Contracts
} from '../../src/graphprotocol-utils'

import { 
  BigDecimal,Address
} from "@graphprotocol/graph-ts"

// TakerAsk Handler starts here
export function handleOSv1Sale(event: OrdersMatched): void {
  
  //1. load transaction
  let tx = transaction.load(event.transaction.hash.toHexString())
  
  //2. nullcheck transaction entity (one should already exist for the transfer earlier in that) 
  if (tx ){

    //3. create new sale entity (id = tx hash - eventId)  
    let saleEntity = sale.load(event.block.number.toString() + '-' + event.logIndex.toString())
    if (!saleEntity && tx.unmatchedTransferCount > 0) {

      // Assume default value of currency as phony ERC20
      let currencyAddress: Address = Address.fromString('0xbadfeed000000000000000000000000000000000') //update to unknown ERC20
      
      let wethTest = wethTransaction.load(event.transaction.hash.toHexString())
      
      // If there was a transfer of WETH assume the sale occurs in WETH
      if (wethTest) { currencyAddress = Address.fromString('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')}
      //If the transaction value is > 0 then assume the sale occurs in ETH
      if (event.transaction.value != constants.BIGINT_ZERO || event.params.price == constants.BIGINT_ONE) {currencyAddress = Address.fromString(constants.ADDRESS_ZERO)}

      ERC20Contracts.getERC20(currencyAddress)
      let currencyEntity = currency.load(currencyAddress.toHexString())
        
      if (currencyEntity) {
        //4. Assign currency address, amount, txId and platform to sale entity
        let saleEntity = new sale(event.block.number.toString() + '-' + event.logIndex.toString())
        saleEntity.transaction   = tx.id
        saleEntity.currency      = currencyEntity.id
        saleEntity.platform      = 'OpenSea'
        saleEntity.amount        = event.params.price.divDecimal(BigDecimal.fromString('1000000000000000000')) 
        saleEntity.blockNumber   = event.block.number.toI32()
        saleEntity.timestamp     = event.block.timestamp.toI32()
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