import { BigDecimal } from "@graphprotocol/graph-ts"
import {constants} from '../../src/graphprotocol-utils'

import { 
  transfer,
  transaction, 
  token,
  collection,
  dailyCollectionSnapshot, 
  weeklyCollectionSnapshot, 
  monthlyCollectionSnapshot,
} from "../../generated/schema"


export function MatchTransferWithSale(
  TransferId: string,
  transferAmount: BigDecimal,
  TransactionId: string,
  SaleId: string,
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

          // Update token metrics
          let tokenEntity = token.load(transferEntity.token)
          if (tokenEntity) {
            tokenEntity.lastPrice = transferAmount 

            if (transferAmount > tokenEntity.topSale) {
              tokenEntity.topSale = transferAmount
            }
          
            tokenEntity.save()
          }
          
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
          
          // dailyCollectionSnapshot entity starts here

            // The timestamp is in seconds - day = 864000 seconds
            const day = transactionEntity.timestamp.toI32() / 86400 
            
            // The actual timestamp - bring back in if needed
            //const date = transactionEntity.timestamp.toI32()

            // Collection Address - Day
            let dailyCollectionSnapshotEntityId = transferEntity.collection + '-' + day.toString()
            
            let dailyCollectionSnapshotEntity = dailyCollectionSnapshot.load(dailyCollectionSnapshotEntityId)

            if(!dailyCollectionSnapshotEntity) {
              dailyCollectionSnapshotEntity = new dailyCollectionSnapshot(dailyCollectionSnapshotEntityId)
              dailyCollectionSnapshotEntity.timestamp          = day
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

            // dailyCollectionSnapshot entity ends here

            // weeklyCollectionSnapshot entity starts here

            // The timestamp is in seconds - week = 604800 seconds
            const week = transactionEntity.timestamp.toI32() / 604800

            // Collection Address - Week
            let weeklyCollectionSnapshotEntityId = transferEntity.collection + '-' + week.toString()
              
            let weeklyCollectionSnapshotEntity = weeklyCollectionSnapshot.load(weeklyCollectionSnapshotEntityId)

            if(!weeklyCollectionSnapshotEntity) {
                weeklyCollectionSnapshotEntity = new weeklyCollectionSnapshot(weeklyCollectionSnapshotEntityId)
                weeklyCollectionSnapshotEntity.timestamp           = week
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
            
            // weeklyCollectionSnapshot entity ends here
            
            // monthlyCollectionSnapshot entity starts here

            // The timestamp is in seconds - month = 2628288 seconds
            const month = transactionEntity.timestamp.toI32() / 2628288

            // Collection Address - Month
            let monthlyCollectionSnapshotEntityId = transferEntity.collection + '-' + month.toString()
                
            let monthlyCollectionSnapshotEntity = monthlyCollectionSnapshot.load(monthlyCollectionSnapshotEntityId)
            
            if(!monthlyCollectionSnapshotEntity) {
                monthlyCollectionSnapshotEntity = new monthlyCollectionSnapshot(monthlyCollectionSnapshotEntityId)
                monthlyCollectionSnapshotEntity.timestamp            = month
                monthlyCollectionSnapshotEntity.collection           = transferEntity.collection
                monthlyCollectionSnapshotEntity.monthlyVolume        = constants.BIGDECIMAL_ZERO
                monthlyCollectionSnapshotEntity.monthlyTransactions  = 0
                monthlyCollectionSnapshotEntity.topSale              = constants.BIGDECIMAL_ZERO
                monthlyCollectionSnapshotEntity.bottomSale           = constants.BIGDECIMAL_ZERO
            
                monthlyCollectionSnapshotEntity.save()
              }
            // Updating monthly volume & top sale
            monthlyCollectionSnapshotEntity.monthlyVolume = monthlyCollectionSnapshotEntity.monthlyVolume.plus(transferAmount)
            if (transferAmount > monthlyCollectionSnapshotEntity.topSale) {
              monthlyCollectionSnapshotEntity.topSale = transferAmount
              }

            // Updating monthly total number of transactions
            monthlyCollectionSnapshotEntity.monthlyTransactions = monthlyCollectionSnapshotEntity.monthlyTransactions + 1
            
            // Monthly bottom sale
            if (transferAmount < monthlyCollectionSnapshotEntity.bottomSale
                || (monthlyCollectionSnapshotEntity.bottomSale == constants.BIGDECIMAL_ZERO && transferAmount != constants.BIGDECIMAL_ZERO)
                ) {
              monthlyCollectionSnapshotEntity.bottomSale = transferAmount
              }

            // Save metric entities
            dailyCollectionSnapshotEntity.save()
            weeklyCollectionSnapshotEntity.save()
            monthlyCollectionSnapshotEntity.save()

        }
      }
    }
  }
  