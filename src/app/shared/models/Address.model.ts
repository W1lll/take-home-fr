import { UserService } from "src/app/core/user.service";
import { User } from "./User.model";
import { Warehouse } from "./Warehouse.model";
import { TitleCasePipe } from "@angular/common";

export class Address {
  ID: number;
  accountID: number;
  name: string;
  surname: string;
  address: string;
  fullName: string;
  addressExtra: string;
  postcode: string;
  city: string;
  country: string;
  countryCode: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  warehouses: Warehouse[]
  validated: boolean
  titleCasePipe = new TitleCasePipe();

  constructor(data: any) {
    if (data === null || data === undefined) return

    data.warehouses = (data.warehouses || []).map(wh => new Warehouse(wh))

    return Object.assign(this, data)
  }

  canEdit(user: UserService): boolean {
    return user.account.ID == this.accountID
  }

  get fullPhone(): string {
    return `(${this.phoneCountryCode || ''}) ${this.phoneNumber || ''}`
  }
  //TODO: Remove if Splitted address works well in all scenarios
  get fullAddressOld(): string {
    let txt = (this.addressExtra == null || this.addressExtra == '') ? '' : this.addressExtra + ","
    txt += (this.address || '')
    return txt
  }

  /**
   * fullAddress 
   * @description is valid to be used for inline & multiline address
   */

  get fullAddress(): string {
    let txt = this.address ? this.titleCasePipe.transform(this.address) : '';
    txt += (this.addressExtra == null || this.addressExtra == '') ? ' \n' : " " + this.addressExtra + " \n"
    txt += (this.postcode ? this.postcode.toUpperCase() + ", " : '') + ((this.city == null || this.city == '') ? '' : this.titleCasePipe.transform(this.city) + ", ") + (this.country ? this.country.toUpperCase() : '')
    //txt += this.postcode ? this.postcode.toUpperCase() : '';
    return txt
  }

  get fullAddressDisplay(): string {
    let txt = (this.addressExtra == null || this.addressExtra == '') ? '' : this.addressExtra + ","
    txt += (this.address || '')
    return this.fullName+ ' ' + txt
  }

  get fullRegion(): string {
    let txt = (this.city == null || this.city == '') ? '' : this.city + ","
    txt += (this.country || '')
    return txt
  }

  get warehouse(): Warehouse {
    return this.warehouses[0]
  }

}
