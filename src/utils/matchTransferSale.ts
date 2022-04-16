import { BigDecimal, log } from "@graphprotocol/graph-ts"
import {constants} from '../../src/graphprotocol-utils'

import { 
  transfer,
  transaction, 
} from "../../generated/schema"


export function MatchTransferWithSale(
  TransferId: Array<string>,
  amount: BigDecimal,
  TransactionId: string,
  SaleId: string,
  ): void {
    
    

    if (TransferId && amount && TransactionId && SaleId) {
      for (let index = 0; index < TransferId.length; index++) {

        let trId = <string>TransferId[index]            

        // Load the indexed transfer.
        let transferEntity = transfer.load(trId)
        if (transferEntity && transferEntity.amount == constants.BIGDECIMAL_ZERO ){
          let transactionEntity = transaction.load(TransactionId)
          if (transactionEntity) {
        
            // Update transfer amount
            transferEntity.amount = amount 
            transferEntity.matchedSale = SaleId
          
            // Decrease unmatched transfer count by one (in case of batch sales in single transaction)
            transactionEntity.unmatchedTransferCount = transactionEntity.unmatchedTransferCount - 1
        
            transactionEntity.save()
            transferEntity.save()
            
          }
        }
      }
    }
  }