import {Deserializable} from "./helpers/deserializable";
import {Account} from "../../core/user.service";
import {User} from "./User.model";
import {Address} from "./Address.model";
import {Item} from "./Item.model";
import {Invoice, Transaction} from "./Invoice.model";
import {Status} from "./Status.model";
import { Warehouse } from "./Warehouse.model";
import { Fulfillment } from "./Fulfillment.model";
import { Product, ProductVariant } from "./Product.model";
import {SaleChannel} from "./SaleChannel";



export class OrderType {
  ID: number
  name: string

  constructor(data: any) {
    if (data == null) return
    return Object.assign(this, data);
  }
}

export class Order {
  ID: number
  foreignID: string
  accountID: number
  saleChannelID: number
  account: Account
  parentOrderID: number
  siblingOrderID: number
  userID: number
  user: User
  typeID: number
  type : OrderType
  arrivalDate: Date
  reference1: string
  statusID: number
  status: Status
  completedAt: Date
  consignorID: number
  consignor: Address
  consigneeID: number
  consignee: Address
  invoiceID: number
  invoice: Invoice
  quantity: number
  weight: number
  volume: number
  createdAt: Date
  tags: string[]
  items: Item[]
  orderLineItems: OrderLineItem[]
  owedInvoices: Invoice[]
  fulfillments: Fulfillment[]
  saleChannel: SaleChannel
  transactions: Transaction[]

  constructor(data: any) {
    if (data == null) return

    data.user = new User(data.user)
    data.status = new Status(data.status)
    data.consignee = new Address(data.consignee)
    data.consignor = new Address(data.consignor)
    data.originWarehouse = new Warehouse(data.originWarehouse)
    data.destinationWarehouse = new Warehouse(data.destinationWarehouse)
    data.saleChannel = new SaleChannel(data.saleChannel)
    data.items = data.items ? data.items.map(item => new Item(item)) : null
    data.invoice = data.invoice ?  new Invoice(data.invoice) : null
    data.owedInvoices = data.owedInvoices ? data.owedInvoices.map( invoice => new Invoice(invoice)) : []
    data.fulfillments = data.fulfillments ? data.fulfillments.map(fulfillment => new Fulfillment(fulfillment)) : []
    data.type = new OrderType(data.type)
    data.orderLineItems = data.orderLineItems ? data.orderLineItems.map(oli => new OrderLineItem(oli)) : []
    data.tags = data.tags.split(",").filter(tag => tag != "")
    data.transactions = data.transactions ? data.transactions.map(tx => new Transaction(tx)) : []


    return Object.assign(this, data)
  }

}

export class OrderLineItem {
  ID: number
  accountID: number
  itemID: number
  item: Item
  productID: number
  product: Product
  productVariantID: number
  variant: ProductVariant
  orderID: number
  order: Order
  orderTypeID: number
  fulfillmentID: number;
  fulfillment: Fulfillment
  statusID: number
  status: Status;
  fees: number
  payout: number
  cost: number;
  price: number
  profit: number
  notes: string
  acceptedAt: Date
  createdAt: Date
  inventoryID: number
  siblingID: number
  canceledAt: Date
  canceledReason: string
  restocked: boolean
  dispatchedAt: Date
  deliveredAt: Date
  replacePending: boolean

  constructor(data: any) {
    if (data == null) return

    data.status = new Status(data.status)

    data.fulfillment = data.fulfillment ? new Fulfillment(data.fulfillment) : null
    data.product = new Product(data.product)
    data.variant = new ProductVariant(data.variant)
    data.order = new Order(data.order)
    data.item = new Item(data.item)

    return Object.assign(this, data);
  }

  canAccept() {
    if (this.status.name != 'pending') return {value: false, message: 'Can\'t accept order line. It needs to be with status pending'}
    if (this.orderTypeID != 4) return {value: false, message: 'Can\'t accept order line. Available only for orders outbound'}
    if (this.accountID != this.item.accountID) return {value: false, message: 'Can\'t accept order line item. The item doesn\'t belong to you'}

    return {value: true, message: ''}
  }

  canCancel() {
    if (this.canceledAt != null) return {value: false, message: 'Order line item has been already deleted'}
    if (this.item.deletedAt != null) return {value: false, message: 'Item has been already deleted'}
    if (this.item.inventoryID == null && this.orderTypeID != 4) return {value: false, message: 'Item has been already sold. Cancel from the sale order'}
    if (this.deliveredAt != null) return {value: false, message: 'Can\'t cancel order line item with status delivered'}

    return {value: true, message: ''}
  }

  canFulfill() {
    if (this.status.name == 'pending') return {value: false, message: 'Can\'t fulfill order line. It needs to be accepted first'}
    if (this.status.name != 'fulfill') return {value: false, message: 'Can\'t fulfill order line. Order line item with status fulfill can be fulfilled'}
    if (this.item.warehouse.ID != null && this.accountID != this.item.warehouse.accountID) return {value: false, message: 'Can\'t fulfill order line. Currently at another account warehouse'}
    if (this.orderTypeID == 1) return {value: false, message: 'Can\'t fulfill from transfer-in. You have to fulfill from the transfer-out order'}

    return {value: true, message: ''}
  }

  canDispatch() {
    if (this.status.name != 'fulfilling') return {value: false, message: 'Can\'t dispatch order line. It needs to be assigned to a fulfillment first'}
    if (this.orderTypeID != 4 && this.orderTypeID != 2) return {value: false, message: 'Can\'t dispatch order line. Can be done only for outbound orders'}

    return {value: true, message: ''}
  }

  canDeliver() {
    // inbound: origin available => status needs to be dispatched, origin missing => status fulfilling
    if (this.orderTypeID == 3 && (this.status.name != 'fulfilling' && this.status.name != 'dispatched')) return {value: false, message: 'Can\'t deliver order line. It needs have status dispatched first'}
    // outbound: status dispatched
    if (this.orderTypeID == 4 && this.status.name != 'dispatched') return {value: false, message: 'Can\'t deliver order line. It needs have status dispatched first'}
    // transfer: transfer-in: dispatched
    if ((this.orderTypeID == 1 || this.orderTypeID == 2) && this.status.name != 'dispatched') return {value: false, message: 'Can\'t deliver order line. It needs have status dispatched first'}
    // transfer: transfer-out: dispatched
    if ((this.orderTypeID == 2) && this.status.name == 'dispatched') return { value: false, message: 'Can\'t deliver order line from transfer-out. Please do it from it\'s transfer-in' }

    //APPLIES TO ALL ORDERS: Fulfillment Logic

    if ( this.fulfillment.status.name == 'created' && this.status.name == 'dispatched') return {value: true, disabled:true, message: `Please make sure that all items in the fulfillment have been dispatched`}
    // outbound, transfer-out and transfer-in => status needs to be dispatched
    if (this.orderTypeID != 3 && this.status.name != 'dispatched') return {value: false, message: 'Can\'t deliver order line. It needs have status dispatched first'}

    return {value: true, message: ''}
  }
}
