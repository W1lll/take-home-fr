import { Status } from './Status.model';
import {Order} from "./Order.model";
import { User } from './User.model';

export class Invoice {
  ID: number;
  invoiceNumber: number
  totalAmount: number
  totalAmountShipping: number
  totalAmountOwed: number;
  filename: string
  status: Status
  payeeOrder: Order
  payerOrder: Order
  completedAt: Date;
  transactions: Transaction[]

  constructor(input: any) {
    if (input == null) return

    input.totalAmountOwed =  input.totalAmountOwed ? Number(input.totalAmountOwed) : null
    input.totalAmountShipping = input.totalAmountShipping ? Number(input.totalAmountShipping) : null
    input.totalAmount = input.totalAmount ? Number(input.totalAmount) : null
    input.transactions = (input.transactions || []).map(payout => new Transaction(payout))
    input.status = input.status ? new Status(input.status) : null
    input.payeeOrder = new Order(input.payeeOrder)
    input.payerOrder = new Order(input.payerOrder)
    return Object.assign(this, input);
  }

  get payouts(): Transaction[] {
    return this.transactions.filter(tx => tx.type == "payout")
  }

  get amountPaid(): number {
    const totalPaid = this.payouts.filter(tx => (tx.status == 'paid' || tx.status == 'pending')).reduce((tot, tx) => tot += tx.amount, 0)
    return Number(totalPaid.toFixed(2))
  }

  get amountPending(): number {
    let amountPaid = 0
    if (this.payouts){
      this.payouts.map(payout => {
        payout.status == 'pending' ? amountPaid += payout.amount : null
      })
    }
    return Number(amountPaid.toFixed(2))
  }

}

export class Transaction {
  ID: number;
  foreignID: string;
  type: string;
  automatic: string;
  status: string;
  method: string;
  amount: number;
  currency: string;
  //createdByUser: User;
  //account: Account;
  destinationID: string;
  manual: boolean;
  notes: string;
  completedAt: Date;
  toAccountID: number;
  fromAccountID: number;

  constructor(input: any) {
    input.amount = input.amount ? Number(input.amount) : null;
    input.createdByUser = input.createdByUser ? new User(input.createdByUser) : null;
    return Object.assign(this, input);
  }
}

