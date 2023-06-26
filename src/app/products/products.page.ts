import {Component, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../core/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {ModalService} from "../shared/modal/modal.service";
import {UserService} from "../core/user.service";
import { environment } from 'src/environments/environment';
import {Order} from "../shared/models/Order.model";
import {DataRequest, TableConfiguration, TableWrapperComponent} from "../shared/table-wrapper/table-wrapper.component";
import {Product, ProductVariant} from "../shared/models/Product.model";
import {FliproomListComponent} from "../shared/fliproom-list/fliproom-list.component";
import { filter } from 'rxjs';


@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
})
export class ProductsPage implements OnInit {

  @ViewChild('tableWrapper') tableWrapper:
    TableWrapperComponent;
  @ViewChild('fliproomList') fliproomList: FliproomListComponent;

  public environment = environment
  public tableConfigs: TableConfiguration = new TableConfiguration({
    columnsConfig: [],
    tableKey: 'products',
    showColumnsSelection: true,
    showAdvancedFilter: true,
    rowHoverable: true,
    emptyTablePlaceholder: 'No products available. Please create one',
    dataSourceFnName: 'getProductsList' // pass this to allow table download
  })

  public buttons = []

  public dataRequested;
  public isLoading: boolean =  false;
  public currentSelectedSegment  = 'private'
  public statusesTabsList: string[] = ['private', 'public']
  public variantMode = false

  public productViewColumnConfig = [
    {reference: 'imageReference',            displayedName: 'Image',         dataType: 'string', disableFilter: true},
    {reference: 'ID',                        displayedName: 'ID',            dataType: 'string'},
    {reference: 'title',                     displayedName: 'Title',            dataType: 'string'},
    {reference: 'category.name',                     displayedName: 'Category',            dataType: 'string'},
    {reference: 'code',                      displayedName: 'Code',            dataType: 'string'},
    {reference: 'createdAt',                      displayedName: 'Created At',   dataType: 'date'},
    {reference: 'status',                    displayedName: 'Status',            dataType: 'string'},
    {reference: 'sourceProductID',       displayedName: 'Synced ID',            dataType: 'string'},
    {reference: 'sourceProduct.title',       displayedName: 'Synced Product',            dataType: 'string'},
  ]

  public variantViewColumnConfig = [
    {reference: 'product.imageReference',            displayedName: 'Image',         dataType: 'string', disableFilter: true},
    {reference: 'product.ID',                        displayedName: 'Product ID',            dataType: 'string'},
    {reference: 'product.title',                     displayedName: 'Product Title',            dataType: 'string'},
    {reference: 'product.category.name',             displayedName: 'Category',            dataType: 'string'},
    {reference: 'product.code',                      displayedName: 'Code',            dataType: 'string'},
    {reference: 'product.createdAt',                 displayedName: 'Created At',   dataType: 'date'},
    {reference: 'product.sourceProductID',           displayedName: 'Synced Product ID',            dataType: 'string'},
    {reference: 'product.sourceProduct.title',       displayedName: 'Synced Product',            dataType: 'string'},
    {reference: 'product.status',                    displayedName: 'Product Status',            dataType: 'string'},
    {reference: 'ID',                                displayedName: 'ID',            dataType: 'string'},
    {reference: 'name',                              displayedName: 'Name',            dataType: 'string'},
    {reference: 'position',                          displayedName: 'Idx',            dataType: 'string'},
    {reference: 'price',                             displayedName: 'Lowest Price',            dataType: 'number'},
    {reference: 'gtin',                             displayedName: 'GTIN',            dataType: 'string'},
    {reference: 'sourceProductVariantID',            displayedName: 'Synced ID',            dataType: 'string'},
    {reference: 'sourceProductVariant.name',         displayedName: 'Synced Variant',            dataType: 'string'},
    {reference: 'sourceProductVariant.price',        displayedName: 'Market Price',            dataType: 'number'},
    {reference: 'sourceProductVariant.updatedAt',    displayedName: 'Last Sync',            dataType: 'string'},
    {reference: 'status',                            displayedName: 'Status',            dataType: 'string'},
  ]

  constructor(
    private _api: ApiService,
    private _route: ActivatedRoute,
    private _modalCtrl: ModalService,
    private _router: Router,
    public user: UserService
  ) {
    //set product view config
    this.tableConfigs.columnsConfig =  !this.variantMode ? this.productViewColumnConfig : this.variantViewColumnConfig
    this.tableWrapper ? this.tableWrapper.ngOnInit() : null
  }

  ngOnInit() {
    if (!this.variantMode) {
      this.buttons.push({label: 'variant mode', icon: 'auto_mode', id: 'variant-mode'})
    } else {
      this.buttons.push({label: 'product mode', icon: 'auto_mode', id: 'product-mode'})
    }

    this.buttons.push({label: 'create', icon: 'add', id: 'create-product'})

  }

  ionViewWillEnter() {
    this.onRefresh()
  }

  onRefresh() {
    this.tableWrapper ? this.tableWrapper.refresh() : null
    this.fliproomList ? this.fliproomList.refresh() : null
  }

  onSegmentChanged(evt){
    this.currentSelectedSegment = evt.detail.value
    this.onRefresh()
  }

  onDataRequest(evt: DataRequest): void {
    const productType = this.currentSelectedSegment
    //product and variant mode data fetching
    //product view mode
    if(!this.variantMode){
      evt.params['status'] = evt.params['status'] ? evt.params['status']  : ['!deleted']
      //Filter order status based on current tab selected
      if (productType == "public") {
        evt.params['public'] = true
      }
      else {
        evt.params['public'] = false
        evt.params['accountID'] = this.user.account.ID
      }

      this._api.getProductsList(evt.pageIdx, evt.pageSize, evt.sort, evt.params).subscribe((resp) => {
        this.dataRequested = resp;
        this.isLoading = false
      });
    }
    //variant view
    else {
      evt.params['status'] = evt.params['status'] ? evt.params['status']  : ['!deleted']
      evt.params['product.status'] = evt.params['product.status'] ? evt.params['product.status']  : ['!deleted']
      //Filter order status based on current tab selected
      if (productType == "public") {
        evt.params['product.public'] = true
      }
      else {
        evt.params['product.public'] = false
        evt.params['product.accountID'] = this.user.account.ID
      }

      this._api.getVariantsList(evt.pageIdx, evt.pageSize, evt.sort, evt.params).subscribe((resp) => {
        this.dataRequested = resp;
        this.isLoading = false
      });
    }
  }

  //Edit product
  onRowClick(product: Product) {
    this.onOpenProductForm(product)
  }

  onButtonClick(buttonId: string) {
    if (buttonId == 'create-product') {
      this.onOpenProductForm()
    }
    else if (buttonId == 'product-mode') {
      this.toggleVariantMode(false)
    }
    else if (buttonId == 'variant-mode') {
      this.toggleVariantMode(true)
    }
  }

  //table mode changing
  toggleVariantMode(active){
    this.isLoading = true
    this.variantMode = active
    this.dataRequested = {rows: [], count: 0}
      this.buttons.map((button, index) => {
        //Variant mode
        if (button.id == 'variant-mode'  && active) {
          console.log('Enabling Variant Mode')
          this.buttons[index].id = 'product-mode'
          this.buttons[index].label = 'product mode'
          this.tableConfigs.columnsConfig = this.variantViewColumnConfig
          this.tableConfigs.tableKey = 'product-variants'
          this.tableConfigs.emptyTablePlaceholder = 'No product variants available. Please create a product'
          this.tableConfigs.dataSourceFnName = 'getVariantsList'

          }
        //Product mode
        if (button.id == 'product-mode' && !active) {
          console.log('Enabling Product Mode')
          this.buttons[index].id = 'variant-mode'
          this.buttons[index].label = 'variant mode'
          this.tableConfigs.columnsConfig = this.productViewColumnConfig
          this.tableConfigs.tableKey= 'products'
          this.tableConfigs.emptyTablePlaceholder= 'No products available. Please create one'
          this.tableConfigs.dataSourceFnName= 'getProductsList'
        }
      })
    this.onRefresh()
    this.isLoading = false
  }


  onOpenHelp() {
    this._modalCtrl.help('products').subscribe(() => {})
  }

  onOpenProductForm(product:Product = null){
    //default sets form to 'create' type
    let queryParams = {formType: 'create'}
    // if public product is edited
    if (product && product.public ) {
      //if user tries to select public product but has no permission to create products

      this._modalCtrl.confirm("Please note public products can't be edited, would you like to proceed to product creation using this as a template?").pipe(
        filter(res => res)
      ).subscribe(res => {
        queryParams['productID'] = product.ID
        this._router.navigate(['/products/form'], {queryParams: queryParams})
      })
    } else if (product && !product.public) { //if private product edited
      queryParams['formType'] = 'update',
      queryParams['productID'] = product.ID
      this._router.navigate(['/products/form'], {queryParams: queryParams})
    } else {
      this._router.navigate(['/products/form'], {queryParams: queryParams})
    }
  }




}
