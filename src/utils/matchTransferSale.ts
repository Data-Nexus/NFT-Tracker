import { BigDecimal } from "@graphprotocol/graph-ts"
import {constants} from '../../src/graphprotocol-utils'

import { 
  transfer,
  transaction, 
} from "../../generated/schema"


export function MatchTransferWithSale(
    TransferId: Array<string>,
    amount: BigDecimal,
    TransactionId: string,
    ): void {
      
      for (let index = 0; index < TransferId.length; index++) {
                
        // Load the indexed transfer.
        let transferEntity = transfer.load(TransferId[index])
        let tx = transaction.load(TransactionId)
        if (tx != null) {
        
          if (transferEntity != null && transferEntity.amount == constants.BIGDECIMAL_ZERO ) {
        
          // Update transfer amount
          transferEntity.amount = amount 

          tx.unmatchedTransferCount = tx.unmatchedTransferCount - 1
        
          tx.save()
          transferEntity.save()
        
          }
        }
      }
    }