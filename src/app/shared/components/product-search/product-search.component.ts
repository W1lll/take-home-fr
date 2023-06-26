import {Component, ElementRef, Inject, Input, OnInit, ViewChild} from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ApiService } from 'src/app/core/api.service';
import { Product } from '../../models/Product.model';
import {MAT_DIALOG_DATA} from "@angular/material/dialog";
import {FliproomListComponent} from "../../fliproom-list/fliproom-list.component";
import {ModalService} from "../../modal/modal.service";
import { Router } from '@angular/router';
import {UserService} from "../../../core/user.service";
import {filter, map, mergeMap, of, switchMap} from "rxjs";
import { environment } from 'src/environments/environment';


export interface IProductSearchInput {
  private?: boolean;
  public?: boolean;
  consignment?: boolean;
  accountID?: number;
  searchQuery?: string;
  prefilledSearchText?: string;
  redirectTo?: string
}


@Component({
  selector: 'app-product-search',
  templateUrl: './product-search.component.html',
  styleUrls: ['./product-search.component.scss'],
})



export class ProductSearchComponent implements OnInit {
  /**
   * Module used to select products from private or public catalogue or import product from stockx.
   *
   * Product module is used in
   *    inventory    - add inventory (private and consignment catalogues)
   *    listing form - match product on external account (private catalogue and external accountID)
   *    marketplace  - search among public products (public catalogue)
   *    POS system   - search product to add to order (private catalogue)
   *    transfers    - select product to add to transfer (private catalogue)
   *    product form - set synced product and select template product (public catalogue)
   *
   *    CONSIGNMENT CATALOGUE:
   *      - 1. show external products
   *      - 2. on consignment product selection:
   *            a. find existing prod match => return prod
   *            b. no match found => create product
   */

  public dataRequested = null;
  public environment = environment;
  public catalogueSelected: string;

  @Input() data: IProductSearchInput
  @ViewChild('fliproomList') fliproomList: FliproomListComponent;
  @ViewChild('cataloguesTabs') cataloguesTabs;

  public catalogues: string[] = []
  public prefilledSearchText: string;
  public redirectTo: string;

  constructor(
    private _api: ApiService,
    private _modalCtrl: ModalController,
    private _modal: ModalService,
    private _router: Router,
    public user: UserService
  ) { }

  ngOnInit() {
    // show private products if private:false not passed as param
    if (this.data?.private != false) {
      this.catalogues.push('private')
    }

    // show public products if public:true passed as param
    if (this.data?.public == true) {
      this.catalogues.push('public')
    }

    // show consignment catalogue if consignment:true is passed as a param
    if (this.data?.consignment == true) {
      this.catalogues.push('consignment')
    }

    // show product to sync if exist
    if (this.data?.prefilledSearchText) {
      this.prefilledSearchText = this.data.prefilledSearchText
    }

    // track redirectTo if is passed as a param (Ex: redirectTo: 'inventory')
    if (this.data?.redirectTo) {
      this.redirectTo = this.data.redirectTo
    }


    this.catalogueSelected = this.catalogues[0]

    this.onRefresh()
  }

  ionViewWillLeave() {
    this._modalCtrl.dismiss(null, 'submit')
  }

  onSegmentChanged(){
    this.onRefresh()
  }

  onDataRequest(evt) {
    evt.params['public'] = this.catalogueSelected == 'public'
    evt.params['status'] = '!deleted'

    if (evt.params['public'] === false) {
      if(this.catalogueSelected == 'consignment'){
        evt.params['accountIDs'] = this.user.account.externalSaleChannelAccountIDs
      }
      else{
        evt.params['accountID'] = this.data?.accountID || this.user.account.ID
      }
    }

    const searchQuery = this.fliproomList.activeSearch || this.data.searchQuery
    if (searchQuery) {
      evt.params['search'] = searchQuery
    }


    this._api.getProductsList(evt.pageIdx, 30, evt.sort, evt.params).subscribe((resp) => {
      this.dataRequested = resp;
    });
  }

  onRowClick(product: Product) {
    this.fliproomList.isLoading = true
    this._api.getProduct(product.ID).subscribe(_product => {
      this._modalCtrl.dismiss(_product, 'submit')
    })


  }

  onClose() {
    this._modalCtrl.dismiss(null, 'submit')
  }

  onRefresh() {
    this.fliproomList ? this.fliproomList.refresh() : null
  }

  get placeholderButtonText(): string {
    if (this.catalogueSelected== 'private'  && !this.consignmentProductsAvailable) {
      return 'Create new product'
    }
    if (this.catalogueSelected== 'consignment' && this.consignmentProductsAvailable) {
      return 'Create new product'
    }
    else if(this.catalogueSelected== 'private' && this.consignmentProductsAvailable ){
      return 'Consignment Catalogue'
    }
    else if (this.catalogueSelected == 'public') {
      return 'Import product from StockX '
    } else {
      return ''
    }
  }

  get showNoDataButton(): boolean {
     return this.dataRequested && this.dataRequested.data.length == 0 && !this.fliproomList.isLoading
  }

  get noDataDisplayMessage(): string {
    if (this.catalogueSelected == 'consignment'){
      return 'No consignment products available, please contact consignment store to create product'
    }
    else if (this.catalogueSelected == 'private'){
      return 'No products found on your account catalogue'
    }
    else if (this.catalogueSelected == 'public'){
      return 'No template products available'
    }
    else {
      return ''
    }

  }

  get consignmentProductsAvailable(){
    return this.catalogues.find((tab)=> tab == 'consignment')
  }

  tabDisplayName(tab){
    switch(tab) {
      case 'private':
        return 'my products'
      case 'public':
        return 'template products'
      case 'consignment':
        return 'consignment products'
      default:
        return this.catalogueSelected

    }
  }

  onPlaceholderButtonClick(action) {
    switch(action) {
      case 'create':
        let subscription = of('prod')
        if(this.catalogueSelected == 'consignment'){
          subscription = this._modal.confirm('Please note even if you create a product you will not be able to consign it until the consignment store creates the same product on their end')
        }
        subscription.subscribe(res => {
          if(res){
            this.onClose()
            let params: any = { queryParams: { formType: 'create' }};
            (this.redirectTo) ? params.queryParams.redirectTo = this.redirectTo : null;
            this._router.navigate(['/products/form'], params)
          }
        })
        break;
      case 'goto-consignment':
        this.catalogueSelected ='consignment' // got to consignment catalogue
        this.onSegmentChanged()
        break;
      case 'import':
        this.onStockxImportRequest()
        break;

    }
  }

  //action if public catalogue is empty
  onStockxImportRequest() {
    // enabled only if list is using public products. request import of a stockx product from its url
    this._modal.input({title: 'stockx url', subtitle: 'past here the url of the stockx product to import', type: 'string'}).pipe(
      filter(res => res),
      mergeMap(unformattedStockxUrl => {
        this._modal.info('Searching for the product on the market..')
        return this._api.stockxApiImportRequest(unformattedStockxUrl)
      })
    )
    .subscribe((res) => {
      if (res.length > 0) {
        this._modal.success('Product found. Import queued check again shortly')
        return res[0]
      } else {
        this._modal.warning('Product not found. Be sure to have imported a valid url')
        return null
      }
    })
  }
}
