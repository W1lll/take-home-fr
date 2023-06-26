import { Deserializable } from './helpers/deserializable';
import {Product, ProductVariant} from './Product.model';
import { Item } from './Item.model';
import { Account } from 'src/app/core/user.service';
import { Warehouse, WarehouseLocation } from './Warehouse.model';
import {Status} from "./Status.model";
import { SaleChannel } from './SaleChannel';



export class InventoryRecord {
  ID: number
  productVariantID: number
  accountID: number
  account: Account
  product: Product
  productID: number // Added to be used in listing
  variant: ProductVariant
  items: Item[]
  quantity: number
  cost: number
  price: number
  notes: string
  selectedQuantity:  number = 0
  priceSourceName: string
  priceSourceMargin: number
  virtual: boolean
  warehouseID: number
  warehouseLocationID: number
  warehouse: Warehouse
  location: WarehouseLocation
  locationID: number
  status: Status
  listings: InventoryListing[]
  isSelectable: boolean
  //TODO: remove on rules application
  setPrice: boolean

  constructor(data: any) {
    if (data == null) {
      return null;
    }

    data.price = parseFloat(data.price)
    data.product = new Product(data.product)
    data.variant = new ProductVariant(data.variant)
    data.status = new Status(data.status)
    data.items = data.items ? data.items.map(item => new Item(item)): null
    data.warehouse = new Warehouse(data.warehouse)
    data.location = new WarehouseLocation(data.location)
    data.listings = data.listings ? data.listings.map(listing => new InventoryListing(listing)): []

    return Object.assign(this, data)
  }

  get payoutsRange() {
    const payouts = this.listings.map(listing => listing.payout)
    const minPayout = Math.min(...payouts)
    const maxPayout = Math.max(...payouts)
    return {min: minPayout, max: maxPayout}
  }

  get profitsRange() {
    return {min: (this.payoutsRange.min - (this.cost || 0)), max: (this.payoutsRange.max - (this.cost || 0))}
  }

  get activeListings(): InventoryListing[] {
    return this.listings.filter(l => l.status == 'active')
  }
}

export class InventoryListing {
  ID: number
  saleChannelID: number
  accountID: number
  productID: number
  productVariantID: number
  payout: number
  price: number
  status: string
  priceSourceName: string
  priceSourceMargin: number

  product: Product
  variant: ProductVariant
  inventory: InventoryRecord
  saleChannel: SaleChannel
  account: Account

  constructor(data: any) {
    if (data == null) return

    data.payout = parseFloat(data.payout)
    data.price = parseFloat(data.price)
    data.product = new Product(data.product)
    data.variant = new ProductVariant(data.variant)
    data.inventory = new InventoryRecord(data.inventory)
    data.account = new Account(data.account)
    data.saleChannel = new SaleChannel(data.saleChannel)

    return Object.assign(this, data)
  }
}
