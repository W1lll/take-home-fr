import { Deserializable } from './helpers/deserializable';
import { Product, ProductVariant } from './Product.model';
import {Warehouse, WarehouseLocation} from './Warehouse.model';
import {InventoryRecord} from "./InventoryRecord";
import { Order } from './Order.model';
import { Account } from 'src/app/core/user.service';
import {JobLineItem} from "./Job.model";
import { Status } from './Status.model';


export class Item {
  ID: number
  productID: number
  variantID: number
  locationID: number
  warehouseID: number
  inventoryID: number
  accountID: number;
  barcode: string
  volume: number
  weight: number
  deletedAt: Date
  statusID: number
  product: Product
  variant: ProductVariant
  location: WarehouseLocation
  warehouse: Warehouse
  orders: Order[]
  jobLineItems: JobLineItem[]
  inventory: InventoryRecord
  account: Account;
  status: Status

  constructor(input: any) {
    if (input == null) return

    input.account =  new Account(input.account)
    input.status =  new Status(input.status)
    input.product =  new Product(input.product)
    input.variant =  new ProductVariant(input.variant)
    input.location = new WarehouseLocation(input.location)
    input.inventory = new InventoryRecord(input.inventory)
    input.warehouse = new Warehouse(input.warehouse)
    input.orders = input.orders ? input.orders.map(order => new Order(order)) : []
    input.jobLineItems = input.jobLineItems ? input.jobLineItems.map(jli => new JobLineItem(jli)) : []
    return Object.assign(this, input);
  }

  //sorts orders belonging to item by ID descending order
  get sortedOrders(): Order[]{
    return this.orders.sort(function(a, b) {
      return b.ID- a.ID;
    });
  }

  //Gets last transfer out transferred to order
  get latestTransferOut(): Order{
    return this.sortedOrders.find(order => order.type.name == 'transfer-out')
  }

  //Gets last transfer in transferred to order
  get latestTransferIn(): Order{
    return this.sortedOrders.find(order => order.type.name == 'transfer-in')
  }

  //Gets last transfer a
  latestAccountTransfer(accountID): Order{
    const _latestTransferOut = this.latestTransferOut
    const _latestTransferIn = this.latestTransferIn
    if (!_latestTransferOut || !_latestTransferIn){
      return null
    }
    if(_latestTransferIn.accountID == accountID) {
      return _latestTransferIn
    }
    if (_latestTransferOut.accountID == accountID) {
      return _latestTransferOut
    }
  }
}
