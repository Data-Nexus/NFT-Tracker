import { BigDecimal } from "@graphprotocol/graph-ts"
import {constants} from '../../src/graphprotocol-utils'

import { 
  transfer,
  transaction, 
  token,
  collection,
} from "../../generated/schema"


export function MatchTransferWithSale(
  TransferId: string,
  amount: BigDecimal,
  TransactionId: string,
  SaleId: string,
  ): void {
    
     if (TransferId && amount && TransactionId && SaleId) {
       
      // Load the indexed transfer.
      let transferEntity = transfer.load(TransferId)
      if (transferEntity && transferEntity.amount == constants.BIGDECIMAL_ZERO ){
        let transactionEntity = transaction.load(TransactionId)
        if (transactionEntity) {
        
          // Update transfer values
          transferEntity.amount = amount 
          transferEntity.matchedSale = SaleId
          
          // Decrease unmatched transfer count by one (in case of batch sales in single transaction)
          transactionEntity.unmatchedTransferCount = transactionEntity.unmatchedTransferCount - 1
          
          transferEntity.save()
          transactionEntity.save()

          // Update token metrics
          let tokenEntity = token.load(transferEntity.token)
          if (tokenEntity) {
            tokenEntity.lastPrice = amount 

            if (amount > tokenEntity.topSale) {
              tokenEntity.topSale = amount
            }
          
            tokenEntity.save()
          }
          
          // Update collection metrics
          let collectionEntity = collection.load(transferEntity.collection)
          if (collectionEntity) {
            collectionEntity.totalSales = collectionEntity.totalSales + 1
            collectionEntity.totalVolume = collectionEntity.totalVolume.plus(amount)

            if (amount > collectionEntity.topSale) {
              collectionEntity.topSale = amount
            }

            collectionEntity.save()
          }
          
        }
      }
    }
  }
  