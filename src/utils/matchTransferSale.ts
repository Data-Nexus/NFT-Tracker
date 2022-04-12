import { BigDecimal } from "@graphprotocol/graph-ts"

import { transfer } from "../../generated/schema"

export function MatchTransferWithSale(
    eventNum: Array<string>,
    tx: string,
    amount: BigDecimal
    ) {
      let events : Array<string> = eventNum
      
      for (let index = 0; index < eventNum.length; index++) {
        
        // Determine current node ID.
        let eventNumber = <string>events[index]
        if (events == null) continue
    
        // Load the indexed transfer.
        let transferEntity = transfer.load(tx + '-' + eventNumber)//need to add + [event from array] 
        if (transferEntity != null) {
        
        // Update transfer amount
        transferEntity.amount = amount 
        
        transferEntity.save()
        
        }
    
      }
}