import {Address} from "./Address.model";
import {Order, OrderLineItem} from "./Order.model";
import {Status} from "./Status.model";
import { User } from "./User.model";
import {Account} from "../../core/user.service";


export class Fulfillment {
  ID: number
  accountID: number
  reference1: string
  foreignID: string
  origin: Address;
  originAddressID: number;
  destinationAddressID: number
  destination: Address
  inboundOrder: Order
  inboundOrderID: number
  outboundOrder: Order
  outboundOrderID: number
  shippingLabelFilename: string
  courier: Courier
  courierID: number
  statusID: number
  status: Status
  trackingNumber: string
  orderLineItems: OrderLineItem[]
  canceledAt: Date;
  completedAt: Date;
  updatedAt: Date;
  createdAt: Date;
  createdByUser: User

  constructor(data: any) {
    if (data == null) return

    data.destination = new Address(data.destination)
    data.inboundOrder = new Order(data.inboundOrder)
    data.origin = new Address(data.origin)
    data.orderLineItems = data.orderLineItems ? data.orderLineItems.map(oli => new OrderLineItem(oli)) : null
    data.outboundOrder = new Order(data.outboundOrder)
    data.status = new Status(data.status)
    data.courier = data.courier ? new Courier(data.courier) : null // leave it null to show as manual
    data.createdByUser = new User(data.createdByUser)

    return Object.assign(this, data)
  }
}

export class Courier {
  ID: number
  code: string
  name: string
  foreignID: string
  nationalServices: string
  courierBillingAccount: string
  accountID: number
  account : Account

  constructor(data: any) {
    if (data == null) return
    data.account = data.account? new Account(data.account): null
    return Object.assign(this, data)
  }

  getNationalServices(): string[] {
    return this.nationalServices.split(",")
  }
}
