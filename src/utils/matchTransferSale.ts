import { BigDecimal } from "@graphprotocol/graph-ts"
import {constants} from '../../src/graphprotocol-utils'

import { 
  transfer,
  transaction, 
  collection,
  hourlyCollectionSnapshot, 
  dailyCollectionSnapshot, 
  weeklyCollectionSnapshot,
} from "../../generated/schema"


export function MatchTransferWithSale(
  TransferId: string,
  transferAmount: BigDecimal,
  TransactionId: string,
  SaleId: string,
  CurrencySymbol: string,
  ): void {
    
     if (TransferId && transferAmount && TransactionId && SaleId) {
       
      // Load the indexed transfer.
      let transferEntity = transfer.load(TransferId)
      if (transferEntity && transferEntity.amount == constants.BIGDECIMAL_ZERO ){
        let transactionEntity = transaction.load(TransactionId)
        if (transactionEntity) {
        
          // Update transfer values
          transferEntity.amount = transferAmount 
          transferEntity.matchedSale = SaleId
          
          // Decrease unmatched transfer count by one (in case of batch sales in single transaction)
          transactionEntity.unmatchedTransferCount = transactionEntity.unmatchedTransferCount - 1
          
          transferEntity.save()
          transactionEntity.save()

          if (CurrencySymbol == 'ETH' || CurrencySymbol == 'WETH') {

            // Update collection metrics
            let collectionEntity = collection.load(transferEntity.collection)
            if (collectionEntity) {
              collectionEntity.totalSales = collectionEntity.totalSales + 1
              collectionEntity.totalVolume = collectionEntity.totalVolume.plus(transferAmount)

              if (transferAmount > collectionEntity.topSale) {
                collectionEntity.topSale = transferAmount
              }

              collectionEntity.save()
            }

            // hourlyCollectionSnapshot entity starts here

              // The timestamp is in seconds - day = 864000 seconds
              const hour = transactionEntity.timestamp / 3600 
              
              // Collection Address - Day
              let hourlyCollectionSnapshotEntityId = transferEntity.collection + '-' + hour.toString()
              
              let hourlyCollectionSnapshotEntity = hourlyCollectionSnapshot.load(hourlyCollectionSnapshotEntityId)

              if(!hourlyCollectionSnapshotEntity) {
                hourlyCollectionSnapshotEntity = new hourlyCollectionSnapshot(hourlyCollectionSnapshotEntityId)
                hourlyCollectionSnapshotEntity.timestamp          = hour * 3600
                hourlyCollectionSnapshotEntity.collection         = transferEntity.collection
                hourlyCollectionSnapshotEntity.hourlyVolume        = constants.BIGDECIMAL_ZERO
                hourlyCollectionSnapshotEntity.hourlyTransactions  = 0
                hourlyCollectionSnapshotEntity.topSale            = constants.BIGDECIMAL_ZERO
                hourlyCollectionSnapshotEntity.bottomSale         = constants.BIGDECIMAL_ZERO

                hourlyCollectionSnapshotEntity.save()
              }

              // Updating daily total volume & top sale
              hourlyCollectionSnapshotEntity.hourlyVolume = hourlyCollectionSnapshotEntity.hourlyVolume.plus(transferAmount)
              if (transferAmount > hourlyCollectionSnapshotEntity.topSale) {
                hourlyCollectionSnapshotEntity.topSale = transferAmount
              }

              // Updating daily total number of transactions
              hourlyCollectionSnapshotEntity.hourlyTransactions = hourlyCollectionSnapshotEntity.hourlyTransactions + 1

              // Daily bottom sale
              if (transferAmount < hourlyCollectionSnapshotEntity.bottomSale 
                  || (hourlyCollectionSnapshotEntity.bottomSale == constants.BIGDECIMAL_ZERO && transferAmount != constants.BIGDECIMAL_ZERO)
                  ) {
                    hourlyCollectionSnapshotEntity.bottomSale = transferAmount
              }

              hourlyCollectionSnapshotEntity.hourlyAvgSale = hourlyCollectionSnapshotEntity.hourlyVolume.div(
                BigDecimal.fromString(hourlyCollectionSnapshotEntity.hourlyTransactions.toString())) 

              // hourlyCollectionSnapshot entity ends here

              // dailyCollectionSnapshot entity starts here

              // The timestamp is in seconds - day = 864000 seconds
              const day = transactionEntity.timestamp / 86400 

              // Collection Address - Day
              let dailyCollectionSnapshotEntityId = transferEntity.collection + '-' + day.toString()
              
              let dailyCollectionSnapshotEntity = dailyCollectionSnapshot.load(dailyCollectionSnapshotEntityId)

              if(!dailyCollectionSnapshotEntity) {
                dailyCollectionSnapshotEntity = new dailyCollectionSnapshot(dailyCollectionSnapshotEntityId)
                dailyCollectionSnapshotEntity.timestamp          = day * 86400
                dailyCollectionSnapshotEntity.collection         = transferEntity.collection
                dailyCollectionSnapshotEntity.dailyVolume        = constants.BIGDECIMAL_ZERO
                dailyCollectionSnapshotEntity.dailyTransactions  = 0
                dailyCollectionSnapshotEntity.topSale            = constants.BIGDECIMAL_ZERO
                dailyCollectionSnapshotEntity.bottomSale         = constants.BIGDECIMAL_ZERO

                dailyCollectionSnapshotEntity.save()
              }

              // Updating daily total volume & top sale
              dailyCollectionSnapshotEntity.dailyVolume = dailyCollectionSnapshotEntity.dailyVolume.plus(transferAmount)
              if (transferAmount > dailyCollectionSnapshotEntity.topSale) {
                dailyCollectionSnapshotEntity.topSale = transferAmount
              }

              // Updating daily total number of transactions
              dailyCollectionSnapshotEntity.dailyTransactions = dailyCollectionSnapshotEntity.dailyTransactions + 1

              // Daily bottom sale
              if (transferAmount < dailyCollectionSnapshotEntity.bottomSale 
                  || (dailyCollectionSnapshotEntity.bottomSale == constants.BIGDECIMAL_ZERO && transferAmount != constants.BIGDECIMAL_ZERO)
                  ) {
                dailyCollectionSnapshotEntity.bottomSale = transferAmount
              }
              
              dailyCollectionSnapshotEntity.dailyAvgSale = dailyCollectionSnapshotEntity.dailyVolume.div(
                BigDecimal.fromString(dailyCollectionSnapshotEntity.dailyTransactions.toString())) 

              // dailyCollectionSnapshot entity ends here

              // weeklyCollectionSnapshot entity starts here

              // The timestamp is in seconds - week = 604800 seconds
              const week = transactionEntity.timestamp / 604800

              // Collection Address - Week
              let weeklyCollectionSnapshotEntityId = transferEntity.collection + '-' + week.toString()
                
              let weeklyCollectionSnapshotEntity = weeklyCollectionSnapshot.load(weeklyCollectionSnapshotEntityId)

              if(!weeklyCollectionSnapshotEntity) {
                  weeklyCollectionSnapshotEntity = new weeklyCollectionSnapshot(weeklyCollectionSnapshotEntityId)
                  weeklyCollectionSnapshotEntity.timestamp           = week * 604800
                  weeklyCollectionSnapshotEntity.collection          = transferEntity.collection
                  weeklyCollectionSnapshotEntity.weeklyVolume        = constants.BIGDECIMAL_ZERO
                  weeklyCollectionSnapshotEntity.weeklyTransactions  = 0
                  weeklyCollectionSnapshotEntity.topSale             = constants.BIGDECIMAL_ZERO
                  weeklyCollectionSnapshotEntity.bottomSale          = constants.BIGDECIMAL_ZERO

                  weeklyCollectionSnapshotEntity.save()
                }

              // Updating weekly volume & top sale
              weeklyCollectionSnapshotEntity.weeklyVolume = weeklyCollectionSnapshotEntity.weeklyVolume.plus(transferAmount)
              if (transferAmount > weeklyCollectionSnapshotEntity.topSale) {
                weeklyCollectionSnapshotEntity.topSale = transferAmount
                }

              // Updating weekly total number of transactions
              weeklyCollectionSnapshotEntity.weeklyTransactions = weeklyCollectionSnapshotEntity.weeklyTransactions + 1

              // Weekly bottom sale
              if (transferAmount < weeklyCollectionSnapshotEntity.bottomSale
                || (weeklyCollectionSnapshotEntity.bottomSale == constants.BIGDECIMAL_ZERO && transferAmount != constants.BIGDECIMAL_ZERO)
                  ) {
                weeklyCollectionSnapshotEntity.bottomSale = transferAmount
                }
              
              weeklyCollectionSnapshotEntity.weeklyAvgSale = weeklyCollectionSnapshotEntity.weeklyVolume.div(
                  BigDecimal.fromString(weeklyCollectionSnapshotEntity.weeklyTransactions.toString())) 
  

              // weeklyCollectionSnapshot entity ends here
              
              // Save metric entities
              hourlyCollectionSnapshotEntity.save()
              dailyCollectionSnapshotEntity.save()
              weeklyCollectionSnapshotEntity.save()
              
          }
        }
      }
    }
  }
  