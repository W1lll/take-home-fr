import {Deserializable} from "./helpers/deserializable";
import {OrderType} from "./Order.model";
import {User} from "./User.model";
import {Account} from "../../core/user.service";
import {Status} from "./Status.model";
import {Item} from "./Item.model";
import {Product, ProductVariant} from "./Product.model";
import {Fulfillment} from "./Fulfillment.model";
import {Type} from "./Type.model";
import {Warehouse} from "./Warehouse.model";


export class Job implements Deserializable {
  ID: number
  accountID: number
  account: Account
  userID: number
  user: User
  typeID: number
  type : Type
  reference1: string
  statusID: number
  status: Status
  completedAt: Date
  startedAt: Date
  quantity: number
  createdAt: Date
  notes: string
  tags: string[]
  items: Item[]
  warehouse: Warehouse
  warehouseID: number
  jobLineItems: JobLineItem[]

  constructor(data: any) {
    if (data == null) return

    data.type = new OrderType(data.type)
    data.jobLineItems = data.jobLineItems ? data.jobLineItems.map(jli => new JobLineItem(jli)) : []
    //data.tags = data.tags.split(",").filter(tag => tag != "")

    return this.deserialize(data)
  }

  deserialize(input: any): this {


    input.status = new Status(input.status)
    input.items = input.items ? input.items.map(item => new Item(item)) : null
    input.warehouse = new Warehouse(input.warehouse)
    return Object.assign(this, input)
  }
}
export class JobLineItem {
  ID: number
  accountID: number
  itemID: number
  item: Item
  productID: number
  product: Product
  productVariantID: number
  variant: ProductVariant
  warehouse: Warehouse
  jobID: number
  job: Job
  jobTypeID: number
  statusID: number
  status: Status;
  notes: string
  action: string
  createdAt: Date
  completedAt: Date
  confirmedAt: Date
  updatedAt: Date
  actionResolvedAt: Date
  inventoryID: number

  constructor(data: any) {
    if (data == null) return

    data.status = new Status(data.status)
    data.product = new Product(data.product)
    data.variant = new ProductVariant(data.variant)
    data.item = new Item(data.item)
    data.job = data.job ? new Job(data.job) : null
    data.warehouse = new Warehouse(data.warehouse)

    return Object.assign(this, data);
  }
}


