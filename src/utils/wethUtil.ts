import { Address } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/IERC721/ERC20";

import {
    transaction,
	wethTransaction
} from '../../generated/schema'



export function handleTransfer(event: Transfer): void {

    let wethTest = wethTransaction.load(event.transaction.hash.toHexString())
    
    if (event.transaction.to == Address.fromString('0x7be8076f4ea4a4ad08075c2508e481d6c946d12b') //OpenseaV1
     || event.transaction.to == Address.fromString('0x7f268357A8c2552623316e2562D90e642bB538E5') //OpenseaV2
     || event.transaction.to == Address.fromString('0x0a267cf51ef038fc00e71801f5a524aec06e4f07') //Genie
     || event.transaction.to == Address.fromString('0x83c8f28c26bf6aaca652df1dbbe0e1b56f8baba2') //GemSwapV2
    ) {
        if (!wethTest) {
            
            let wethEntity = new wethTransaction(event.transaction.hash.toHexString())

            wethEntity.save()
        
        }
    }
}


