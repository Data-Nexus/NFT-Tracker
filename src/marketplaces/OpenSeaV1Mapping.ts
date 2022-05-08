import {
	sale,
	transaction,
  currency,
} from '../../generated/schema'

import {
  MatchTransferWithSale
} from "../../src/utils/matchTransferSale"

import {
  OrdersMatched, AtomicMatch_Call
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
      
        ERC20Contracts.getERC20(Address.fromString(constants.ADDRESS_ZERO))
        let currencyEntity = currency.load(constants.ADDRESS_ZERO)

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

// export function handleOSCurrency(call: AtomicMatch_Call): void {

//   //Look for transaction and sale event
//   let transactionEntity = transaction.load(call.transaction.hash.toHexString())

//   //2. nullcheck transaction entity (one should already exist for the transfer and sale earlier in the mappings)
//   if (transactionEntity) {
    
//     //get ERC20 address for atomic match
//     ERC20Contracts.getERC20(call.inputs.addrs[6])
//     let currencyEntity = currency.load(call.inputs.addrs[6].toString())
    
//     if (currencyEntity) { 
      
//       //3. loop through the transactionEntity.transfers and update the currency to the currencyEntity, 
//       for (let index = 0; index < transactionEntity.transfers.length; index++) {
        
//         //Load the transfer
//         let transferEntity = transfer.load(transactionEntity.transfers[index])
//         if (transferEntity) {
          
//           //Ensure transfer has a matchedSale
//           let saleId = transferEntity.matchedSale
//           if (saleId){
            
//             //load the sale 
//             let saleEntity = sale.load(saleId)
            
//             // If the sale occred on OpenSea and is not the current currency (defaulted to ETH) then update the currency
//             if (saleEntity && saleEntity.platform == 'OpenSea' && saleEntity.currency != currencyEntity.id){
//               //4. reduce metrics if sale was not in ETH/WETH
//               saleEntity.currency = currencyEntity.id
//               saleEntity.save()

//               //if the currency is not ETH/WETH then reduce metrics by amount
//               if (currencyEntity.symbol != 'WETH' && currencyEntity.symbol != 'ETH') {
                
//                 // Update collection metrics
//                 let collectionEntity = collection.load(transferEntity.collection)
//                 if (collectionEntity) {
//                   collectionEntity.totalVolume = collectionEntity.totalVolume.minus(transferEntity.amount)
        
//                   collectionEntity.save()
//                 }
    
//                   // hourlyCollectionSnapshot entity starts here
    
//                   // The timestamp is in seconds - day = 864000 seconds
//                   const hour = transactionEntity.timestamp.toI32() / 3600 
                  
//                   // Collection Address - Day
//                   let hourlyCollectionSnapshotEntityId = transferEntity.collection + '-' + hour.toString()                  
//                   let hourlyCollectionSnapshotEntity = hourlyCollectionSnapshot.load(hourlyCollectionSnapshotEntityId)
    
//                   if(hourlyCollectionSnapshotEntity) {
//                     let reducedHourlyVolume =  hourlyCollectionSnapshotEntity.hourlyVolume.minus(transferEntity.amount)
//                     hourlyCollectionSnapshotEntity.hourlyVolume = reducedHourlyVolume
//                     hourlyCollectionSnapshotEntity.hourlyAvgSale = reducedHourlyVolume.div(
//                       BigDecimal.fromString(hourlyCollectionSnapshotEntity.hourlyTransactions.toString())) 

//                     hourlyCollectionSnapshotEntity.save()
//                   }   
//                   // hourlyCollectionSnapshot entity ends here
    
//                   // dailyCollectionSnapshot entity starts here
    
//                   // The timestamp is in seconds - day = 864000 seconds
//                   const day = transactionEntity.timestamp.toI32() / 86400 
                  
//                   // Collection Address - Day
//                   let dailyCollectionSnapshotEntityId = transferEntity.collection + '-' + day.toString()
                  
//                   let dailyCollectionSnapshotEntity = dailyCollectionSnapshot.load(dailyCollectionSnapshotEntityId)
    
//                   if(dailyCollectionSnapshotEntity) {
//                     let reducedDailyVolume =  dailyCollectionSnapshotEntity.dailyVolume.minus(transferEntity.amount)
//                     dailyCollectionSnapshotEntity.dailyVolume = reducedDailyVolume
//                     dailyCollectionSnapshotEntity.dailyAvgSale = reducedDailyVolume.div(
//                       BigDecimal.fromString(dailyCollectionSnapshotEntity.dailyTransactions.toString())) 

//                     dailyCollectionSnapshotEntity.save()
//                   }    
//                   // dailyCollectionSnapshot entity ends here
    
//                   // weeklyCollectionSnapshot entity starts here
    
//                   // The timestamp is in seconds - week = 604800 seconds
//                   const week = transactionEntity.timestamp.toI32() / 604800
    
//                   // Collection Address - Week
//                   let weeklyCollectionSnapshotEntityId = transferEntity.collection + '-' + week.toString()
//                   let weeklyCollectionSnapshotEntity = weeklyCollectionSnapshot.load(weeklyCollectionSnapshotEntityId)
    
//                   if(weeklyCollectionSnapshotEntity) {
//                     let reducedWeeklyVolume =  weeklyCollectionSnapshotEntity.weeklyVolume.minus(transferEntity.amount)
//                     weeklyCollectionSnapshotEntity.weeklyVolume = reducedWeeklyVolume
//                     weeklyCollectionSnapshotEntity.weeklyAvgSale = reducedWeeklyVolume.div(
//                       BigDecimal.fromString(weeklyCollectionSnapshotEntity.weeklyTransactions.toString())) 

//                     weeklyCollectionSnapshotEntity.save()
//                   }
//                   // weeklyCollectionSnapshot entity ends here
                  
                  
//               }
//             }
//           }
//         }
//       }
//     }
//   }
// }

