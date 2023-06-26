import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Address } from '../shared/models/Address.model';
import { SaleChannel } from '../shared/models/SaleChannel';
import { Warehouse } from '../shared/models/Warehouse.model';

export class Account {
  ID: number;
  name: string;
  currency: string;
  taxRate: number
  vatNumber: string
  isConsignor: boolean;
  billingAddress: Address
  saleChannels: SaleChannel[]
  logo: string;
  warehouses: Warehouse[];
  apiKey: string
  stripeID: string;
  tier: string;
  _sizeChartsString: string

  constructor(input: any) {
    if (input == null) return

    input.billingAddress =  input.billingAddress ? new Address(input.billingAddress) : null
    input.warehouses = (input.warehouses || []).map(wh => new Warehouse(wh))
    input.saleChannels = (input.saleChannels || []).map(sc => new SaleChannel(sc))
    input._sizeChartsString = input.sizeChartConfigs
    return Object.assign(this, input);
  }

  get currencySymbol(): string {
    const currencySymbols = {
      USD: '$',
      GBP: '£',
      EUR: '€',
    };

    return currencySymbols[this.currency];
  }

  get invoicingEnabled(): boolean {
    return this.taxRate != null && this.billingAddress.ID != null && this.vatNumber != null
  }


  get sizeChartConfig(): string[] {
    return  this._sizeChartsString.split(",").filter(chart => chart != "")
  }

  get externalSaleChannelAccountIDs():number[]{
    const externalAccountIDs = new Set<number>()
    this.saleChannels.map(_sc => {
      _sc.accountID != this.ID ? externalAccountIDs.add(_sc.accountID ) : null
    })
    return Array.from(externalAccountIDs)
  }
}

@Injectable({
  providedIn: 'root',
})
export class UserService {

  public ID: number;
  public name: string;
  public surname: string;
  public email: string;
  public password: string;
  public _phoneNumber: string;
  public phoneCountryCode: string;
  public account: Account; // root account for the user
  public organization: Account;
  public deviceID: string;

  constructor(
  ) {}

  deserialize(input) {
    this.ID = input.ID;
    this.name = input.name;
    this.surname = input.surname;
    this._phoneNumber = input.phoneNumber
    this.phoneCountryCode = input.phoneCountryCode
    this.email = input.email;
    this.password = input.password;
    this.account = new Account(input.account);
    this.organization = input.organization;
    this.deviceID = input.deviceID;

    // set user id for analytics once logged in
    return this
  }


  get fullName(): string {
    return `${this.name} ${this.surname}`;
  }

  get phoneNumber(): string {
    return this.phoneCountryCode && this._phoneNumber ? `(${this.phoneCountryCode}) ${this._phoneNumber}` : ''
  }


}

