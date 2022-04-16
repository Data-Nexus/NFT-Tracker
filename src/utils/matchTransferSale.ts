import { BigDecimal } from "@graphprotocol/graph-ts"

import { transfer } from "../../generated/schema"

export function MatchTransferWithSale(
    TransferId: Array<string>,
    amount: BigDecimal,
    ): void {
      
      for (let index = 0; index < TransferId.length; index++) {
                
        // Load the indexed transfer.
        let transferEntity = transfer.load(TransferId[index])
        if (transferEntity != null) {
        
        // Update transfer amount
        transferEntity.amount = amount 
        
        transferEntity.save()
        
        }
    
      }
}