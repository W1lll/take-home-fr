import {Address} from "./Address.model";
import { Account } from 'src/app/core/user.service';

export class Warehouse {
  ID: number;
  name: string;
  accountID: number
  pickingLineOptimization: boolean
  locations: WarehouseLocation[]
  accounts: Account[]
  addressID: number;
  address: Address;
  fulfillmentCentre: boolean;

  constructor(data: any) {
    if (data == null) return

    data.locations = (data.locations || []).map(location => new WarehouseLocation(location))
    data.address = new Address(data.address)
    return Object.assign(this, data)
  }
}

export class WarehouseLocation {
  ID: number;

  warehouse: Warehouse;
  type: WarehouseLocationType;
  typeID: number
  row: string;
  column: string;
  floor: string;
  barcode: string;
  x: number;
  y: number;
  note: string;

  constructor(data: any) {
    if (data == null) return
    data.warehouse = new Warehouse(data.warehouse)
    data.type = new WarehouseLocationType(data.type)
    return Object.assign(this, data)
  }
}

export class WarehouseLocationType {
  ID: number;
  name: string;

  constructor(data: any) {
    if (data == null) return

    return Object.assign(this, data)
  }
}
