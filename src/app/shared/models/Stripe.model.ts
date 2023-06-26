export class StripeBalance {
    availableBalance: Balance;
    pendingBalance: Balance;
    reservedBalance: Balance;
  
    constructor(input: any) {
      input.availableBalance = input.availableBalance ? new Balance(input.availableBalance) : null
      input.pendingBalance = input.pendingBalance ? new Balance(input.pendingBalance) : null
      input.reservedBalance = input.reservedBalance ? new Balance(input.reservedBalance) : null
    return Object.assign(this, input);
    }
  }
  
  export class Balance {
    amount: number;
    currency: string;
  
    constructor(input: any) {
      return Object.assign(this, input);
    }
  }