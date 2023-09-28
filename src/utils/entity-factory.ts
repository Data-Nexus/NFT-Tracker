import {Account} from "../../generated/schema";

export function getOrCreateAccount(address: string): Account {
  let account = Account.load(address);

  if (!account) {
    account = new Account(address);
    account.save();
  }

  return account as Account;
}
