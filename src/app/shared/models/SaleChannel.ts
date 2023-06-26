import { Account } from "src/app/core/user.service";
import { InventoryListing } from "./InventoryRecord";

export class SaleChannel {
  ID: number;
  accountID: number;
  account: Account;
  title: string;
  description: string;
  allowVirtualInventory: boolean
  fees: TransactionRate[]
  isDefault: boolean;
  platform: string
  shopifyStoreName: string
  shopifyAPIAuth: string
  markup: number;
  taxRate: number;
  syncProgress: number;
  policyUrl: string;
  _account_saleChannel: {
    saleChannelID: number
    accountID: number
    tier: string
    status: string
  }

  constructor(data: any) {
    if (data == null) return

    data.account = new Account(data.account)
    data.fees = (data.fees || []).map(fee => new TransactionRate(fee))
    data.markup = parseFloat(data.markup)
    data.taxRate = parseFloat(data.taxRate)

    this._account_saleChannel = data.account_saleChannel
    return Object.assign(this, data)
  }

  /**
   * Get fee rate for a given inventory listing:
   *
   * Given a inventory listing, return (if applicable) the consignment fee rate.
   * The consignment fee rate can be found by using listing.payout or listing.price
   *
   * -Price -> get fee bracket based on price
   * -Payout -> work out price from payout and get fee bracket based on price
   */

  // - if the listing is from the same account as the sale channel, then no fee is applied
  getFeeRate(inventoryListing: InventoryListing): TransactionRate {
    const sortedFees = this.fees.sort((txRate1, txRate2) => txRate1.minPrice < txRate2.minPrice ? -1 : 1)
    let feeToApplyIndex = -1
    //Price = (Payout + Applicable Fee) / (1 - Applicable Fee)
    if (inventoryListing.payout) {
      /**
       * When payout is set cycle through the fee brackets and work out the price with the following formula:
       * Price = (Payout + Applicable Fee) / (1 - Applicable Fee)
       * find the fee bracket that the lowest price falls into
       */

      //cycle through every fee and work out lowest payout
      const minPayoutsDescendingOrder = sortedFees.map(fee=> this.getListingPayoutFromPrice(fee.maxPrice, fee.value))
      minPayoutsDescendingOrder.find((payout,index) => {
        if(  inventoryListing.payout < payout || index+1  == minPayoutsDescendingOrder.length ){
          feeToApplyIndex = index
          return true
        }
        if (  inventoryListing.payout >= payout  && inventoryListing.payout <= minPayoutsDescendingOrder[index + 1]){
          feeToApplyIndex = index +1
          return true
        }
      })
    }
    //If no payout is set, then find the fee bracket that the price falls into
    else {
      feeToApplyIndex = sortedFees.findIndex(fee => inventoryListing.price >= fee.minPrice && inventoryListing.price <= fee.maxPrice)
    }
    //Apply no fee if the listing is from the same account as the sale channel or if no fee is found
    if ( feeToApplyIndex == -1 || this.accountID == inventoryListing.accountID) {
      return new TransactionRate({minPrice: 0, maxPrice: 999999999999999, value: 0, type: 'percentage'})
    }

    return sortedFees[feeToApplyIndex]
  }

  getListingPriceFromPayout(payout, fee): number {
    return payout * 100 / (100 - fee)
  }

  getListingPayoutFromPrice(price, fee): number {
    return price * (100 - fee) / 100;
  }


  computeListingPrice(_inventoryListing: InventoryListing):number {
    //get fee to apply - remove price from listing so it doesn't override the fee
    let inventoryListing = new InventoryListing(JSON.parse(JSON.stringify(_inventoryListing)))
    delete inventoryListing.price
    let feeToApply = this.getFeeRate(inventoryListing)
    let feePercentage = feeToApply.value
    let listingPrice = this.getListingPriceFromPayout(inventoryListing.payout, feePercentage)

    //add any markup
    listingPrice = listingPrice * 100 / (100 - this.markup);
    //add any tax rate - the EDIT LDN has 0 tax on kids at harrods
    const isKids = (['ps', 'td', 'kids', 'infants']).find(keyword => inventoryListing.product.title.toLowerCase().includes(keyword));
    if (!(this.title == 'harrods' && isKids)) {
      listingPrice = listingPrice * (1 + this.taxRate / 100)
    }

    return Number(listingPrice.toFixed(2))
  }

  // get inventory listing payout from price - used only on manual order creations for items that have a sales channel with a mark up
  computeListingPayout(_inventoryListing: InventoryListing): number {
    //deep clone the listing so we don't override the price
    let inventoryListing = new InventoryListing(JSON.parse(JSON.stringify(_inventoryListing)))
    let listingPrice = inventoryListing.price
    //remove any tax rate - the EDIT LDN has 0 tax on kids at harrods
    const isKids = (['ps', 'td', 'kids', 'infants']).find(keyword => inventoryListing.product.title.toLowerCase().includes(keyword));
    if (!(this.title == 'harrods' && isKids)) {
      listingPrice = listingPrice/ (1 + this.taxRate / 100)
    }
    // remove markup
    listingPrice = listingPrice/(100/(100-this.markup))
    //get fee to apply - remove payout from listing so it doesn't override the fee
    delete inventoryListing.price
    let feeToApply = this.getFeeRate(inventoryListing)
    //get payout from price
    let payout =  this.getListingPayoutFromPrice(listingPrice, feeToApply.value)
    return parseFloat(payout.toFixed(2))
  }

  get tier(): string | null {
    return this._account_saleChannel?.tier
  }

  get status(): string | null{
    return this._account_saleChannel.status
  }
}

export class TransactionRate{
  ID: number;
  minPrice: number;
  maxPrice: number;
  value: number;
  type: string

  constructor(data: any) {
    if (data == null) return

    data.minPrice = Number(data.minPrice)
    data.maxPrice = Number(data.maxPrice)
    data.value = Number(data.value)

    return Object.assign(this, data);
  }

}
