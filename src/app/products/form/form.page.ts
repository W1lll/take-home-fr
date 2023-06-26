import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ApiService} from "../../core/api.service";
import {ActivatedRoute, Router} from "@angular/router";
import {UserService} from "../../core/user.service";
import {filter, forkJoin, Observable, of, switchMap} from "rxjs";
import {FormArray, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import * as ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Product, ProductCategory, ProductVariant} from 'src/app/shared/models/Product.model';
import {map, mergeMap, startWith} from "rxjs/operators";
import {ProductSearchComponent} from "../../shared/components/product-search/product-search.component";
import {UtilService} from 'src/app/core/util.service';
import {IModalResponse, ModalService} from 'src/app/shared/modal/modal.service';
import {environment} from 'src/environments/environment';
import {GtinFormComponent} from "../gtin-form/gtin-form.component";
import {SizeChartFormComponent} from "../size-chart-form/size-chart-form.component";

@Component({
  selector: 'app-form',
  templateUrl: './form.page.html',
  styleUrls: ['./form.page.scss'],
})
export class FormPage implements OnInit {

  public productID: number
  public product: Product
  public formType: string
  public productStatusList = ['draft', 'active']
  public Editor = ClassicEditor;
  public maxImages = 4
  public isLoadingData = false
  public isLoadingAction = false
  public scrollSpeed = 300

  // form warehouse images
  public productImagesToUpload: File[] = [];
  public imagesToDisplay = []; // {fileName, url}

  public filteredProductCategories: Observable<ProductCategory[]>;
  private _productCategories: ProductCategory[] = []
  public environment = environment


  @ViewChild('scrollVariants') private variantsContainer: ElementRef;
  @ViewChild('content') private content: any;


  public editorConfig: any = {
    resize_enabled: true,

  };

  constructor(
    private _api: ApiService,
    private _route: ActivatedRoute,
    private _modalCtrl: ModalService,
    private _router: Router,
    public user: UserService,
    public utils: UtilService,
  ) {
  }

  public productForm = new FormGroup({
    ID: new FormControl(null),
    accountID: new FormControl(null, [Validators.required]),
    title: new FormControl(null, [Validators.required]),
    code: new FormControl(null),
    description: new FormControl(null),
    placeholderPrice: new FormControl(0),
    sync: new FormControl(false),
    sourceProduct: new FormControl(null),
    weight: new FormControl(null, [Validators.required]),
    volume: new FormControl(null, [Validators.required]),
    status: new FormControl(null, [Validators.required]),
    category: new FormControl(null, [Validators.required, validateSelector]),
    //manufacturer: new FormControl(null, [Validators.required, validateSelector]),
    variants: new FormArray([]),
  },[duplicateVariantsValidation])

  ngOnInit() {
    this.clearForm()
    this.isLoadingData =true
    //Product category filtering
    this._api.getProductsCategories(0, 999999, null, {'accountID': this.user.account.ID}).subscribe((response) => {
      this._productCategories = response.data
      this.productForm.get('category').updateValueAndValidity() // used to display categories on first open
    })

    this.filteredProductCategories = this.productForm.get('category').valueChanges.pipe(
      startWith(''), //Required to fetch at the first focus on the input
      map(value => value == null ? '' : value),
      map(value => typeof value == 'string' ? value : value.name),
      map(value => this._productCategoryFilter(value))
    );
    const queryParams = this._route.snapshot.queryParams
    if (!queryParams.formType) {
      this._router.navigate(['/products'])
    }
    if (queryParams.productID) {
      //form is being edited fetch product ID
      this.productID = queryParams.productID
    }
    // the view we are coming from
    this.formType = queryParams.formType
    //set account ID
    this.productForm.patchValue({accountID: this.user.account.ID})
    //initialize creation form
    if (this.formType == 'create' && !this.productID ) {
      this.addProductVariant(new ProductVariant({name: 'default'}))
      this.isLoadingData = false
    }
    //editing of public product
    else if (this.formType == 'create' && this.productID){
      this.patchProductForm(this.productID, true)
    }
    else {
      this.patchProductForm(this.productID)
    }
  }

  ionViewWillEnter() {
  }

  ionViewWillLeave() {
    this.clearForm()
  }

  patchProductForm(productID: number, template = false) {
    this.isLoadingData = true
    if(template){
      this.clearForm()
    }
    let chosenProduct = null
      this._api.getProduct(productID).pipe(
      //if template is true, check if this product is a template for another product already
      switchMap(product => {
        console.log(product)
        chosenProduct = product
        return template ? this._api.getProductsList(0, 1, null, {public: false, accountID: this.user.account.ID, sourceProductID: product.ID, status: '!deleted'}) : of(null)
      }),

      switchMap(res => res && res['count'] > 0? this._modalCtrl.confirm(`This product is already a template for product with ID ${res['data'][0].ID}. Would you like to proceed?`): of(true)))
        .subscribe(res => {
          if(!res){
            this.isLoadingData = false
            this.addProductVariant(new ProductVariant({name: 'default'}))
            return
          }
          this.product = chosenProduct
          this.productForm.patchValue({
            //TODO: adapt ID passing when using template
            ID: !template ? chosenProduct.ID : null,
            title: chosenProduct.title,
            accountID: this.user.account.ID,
            //TODO: adaptation to rich text
            description: chosenProduct.description,
            placeholderPrice: null,
            status: chosenProduct.status,
            category: chosenProduct.category,
            code: chosenProduct.code,
            weight: chosenProduct.weight,
            volume: chosenProduct.volume,
          })
          //source product logic
          if (template || chosenProduct.sourceProduct){
            this.productForm.patchValue({
              sourceProduct: template ? chosenProduct : chosenProduct.sourceProduct,
              sync: true
            })
          }
          //push variants to form variants list
          chosenProduct.variants.map(variant => {
            this.addProductVariant(variant,template)
          })
          const sortedImages = chosenProduct.images.sort((a, b) => (a.position > b.position) ? 1 : -1)
          sortedImages.map(image => {
            this.imagesToDisplay.push({fileName: null, url: image.src, ID: image.ID})
          })

          //for public products being used as a template which dont have images created on the database
          if (chosenProduct.imageReference && chosenProduct.images.length == 0) {
            this.imagesToDisplay.push({fileName: null, url: chosenProduct.imageReference, ID: null})
          }
          this.isLoadingData = false

        })
  }


  async onSubmit() {
    //adjust variants syncing
    this.updateVariantsSyncValidation()
    this.productForm.markAllAsTouched()
    this.formValidationMessages()
    if (this.productForm.valid) {
      this.isLoadingAction = true
      let request = of(null)
      // create product images
      if (this.productImagesToUpload.length > 0) {
        request = this._api.uploadProductImages(this.productImagesToUpload)
      }
      request.pipe(
        switchMap(imageURLs => {
          if (imageURLs) {
            //patch image lists with updated urls
            this.replaceImageURLs(imageURLs)
          }

          //Process rest of the form
          const rawProduct = this.productForm.value
          //add variants indexes
          const productVariants = []
          this.variantsArray.controls.map((control, index) => {
            productVariants.push(this.createVariantBody(control.value, index))
          })
          rawProduct['variants'] = productVariants
          const productImages = []
          this.imagesToDisplay.map((image, index) => {
            productImages.push({
              src: image.url,
              position: index
            })
          })
          rawProduct['images'] = productImages
          // patch category to string
          rawProduct['category'] = rawProduct.category.name
          //add images and indexes
          rawProduct['sourceProductID'] = rawProduct.sourceProduct ? rawProduct.sourceProduct.ID : null
          return this._api.createProduct(rawProduct)
        })
      ).subscribe(product => {

        this._modalCtrl.success('Product Created')
        this.clearForm()
        this.isLoadingAction = false
        if (this._route.snapshot.queryParams.redirectTo == "inventory") {
          this._router.navigate([`/inventory/product/${product.ID}`], { queryParams: { action: "add-inventory" } });
        } else {
          this._router.navigate(['/products'])
        }
      })
    }


  }

  /**
   * UPDATE LOGIC:
   *
   * 1. Check if form is valid
   * 2. Create images that need to be created
   * 3. Push product updates
   * 4. Variants:
   *      - update all existing variants - deleted - updated
   *      - create new variants added
   * 5. Images :
   *      - if image from
   */
  onSave() {
    //update all the form validationsn
    this.productForm.markAllAsTouched()
    this.formValidationMessages()
    if (this.productForm.valid) {
      this.isLoadingAction = true
      const updatedProduct = this.productForm.value
      // patch category
      updatedProduct.category = this.productForm.value.category['name']
      //patch source variant
      updatedProduct['sourceProductID'] =  updatedProduct.sourceProduct? updatedProduct.sourceProduct.ID : null
      //update method should only update the body of the product
      let requests = []

      //Create new added images
      let uploadImagesRequest = of(null)
      if (this.productImagesToUpload.length > 0) {
        uploadImagesRequest = this._api.uploadProductImages(this.productImagesToUpload)
      }
      let productUpdateRequests = []
      //image creation and  product update request
      forkJoin([uploadImagesRequest,this._api.updateProduct(this.productID, updatedProduct)])
      .pipe(
        switchMap(resp => {
          const imageURLs = resp[0]
          //product image creation
          if (imageURLs) {
            //patch image lists with updated urls
            this.replaceImageURLs(imageURLs)
          }
          //add image requests
          requests = requests.concat(this.generateImageRequests())
          //add variants requests
          requests = requests.concat(this.generateVariantRequests())
          if (requests.length == 0){
            return of(null)
          }
          return forkJoin(requests)
        })
      ).subscribe((res) => {
        this.clearForm()
        this._modalCtrl.success('Product Updated')
        this.isLoadingAction = false
        this.patchProductForm(this.productID)
      })
    }

  }

  clearVariantsArray() {
    while (this.variantsArray.length !== 0) {
      this.variantsArray.removeAt(0)
    }
  }

  //clear all form components
  clearForm() {
    this.productImagesToUpload = []
    this.imagesToDisplay = []
    this.clearVariantsArray()
    this.productForm.reset()
  }

  //Trigger selection of product when toggled on and patch form whether product is selected or not
  onSyncToggle(value: boolean) {
    this.productForm.patchValue({sync: value})
    //when sync is true but there is already a patched product
    if (value && !this.productForm.value.sourceProduct) {
      let templateProduct = null
      this._modalCtrl.open(ProductSearchComponent, { private: false, public: true, prefilledSearchText: this.productForm.controls['code'].value}).pipe(
        filter(product => {
          //when returning with no product selected in modal
          if (product === null) {
            this.clearSourceProduct()
          }
          return product;
        }),
        switchMap(
          (product:Product) => {
            templateProduct = product
            return this._api.getProductsList(0, 1, null, {public: false, accountID: this.user.account.ID, sourceProductID: product.ID})
          }
        ),
        switchMap((products) => {
          if (products['data'].length > 0) {
            return this._modalCtrl.confirm("You already have a private product created from this public product, would you like to proceed to product creation using this as a template?")
          } else {
            return of(true)
          }
        }))
        .subscribe(
        res => {
          if (templateProduct && res) {
            //patch source product for form
            // map variants to available ones
            this.mapSyncedProduct(templateProduct)
          } else if (!this.productForm.value.sourceProduct) {
            this.clearSourceProduct()
          }
        }
      )
    } else if (!value) {
      // clearing for when sync is false
      this.clearSourceProduct()
    }
  }

  //Clear synced product
  clearSourceProduct() {
    //clear mapped source product
    this.productForm.patchValue({
      sourceProduct: null,
      sync: false
    })
    //clear variants
    this.variantsArray.controls.map(control => {
      control.patchValue({
        sourceProductVariant : null
      })
    })
  }

  updateVariantsSyncValidation(){
    if (this.productForm.value.sourceProduct){
      this.variantsArray.controls.map(control => {
        control.setValidators([Validators.required])
      })
    }
    else {
      this.variantsArray.controls.map(control => {
        control.clearValidators()
      })
    }
  }

  //pass a synced product and match the corresponding variants
  mapSyncedProduct(product){
    this.productForm.patchValue({
      sourceProduct: product,
      sync: true
    })
    // TODO:auto map -> use algolia
  }

  selectSyncedVariant(publicVariant: ProductVariant, variantArrayIndex){
    if(!publicVariant ){
      this.variantsArray.at(variantArrayIndex).patchValue({
        sourceProductVariant: null,
        usSize:  null ,
        ukSize:  null,
        jpSize:  null,
        euSize:  null,
        usmSize:  null ,
        uswSize:  null ,
        gtin:   null ,
      })
    }
    else {
      this.variantsArray.at(variantArrayIndex).patchValue({
        sourceProductVariant: publicVariant,
        usSize:  publicVariant.usSize ,
        ukSize:  publicVariant.ukSize,
        jpSize:  publicVariant.jpSize,
        euSize:  publicVariant.euSize,
        usmSize:  publicVariant.usmSize ,
        uswSize:  publicVariant.uswSize ,
        gtin:   publicVariant.gtin ,
      })
      //checks if user is able to generate variant name automatically
      if( publicVariant.canGenerateNameFromCharts(this.user.account)){
        this._modalCtrl.confirm(`Size chart naming available for this variant update variant name from ${(this.variantsArray.at(variantArrayIndex).value.name).toUpperCase()} to ${publicVariant.generateVariantNameFromCharts(this.user.account).toUpperCase()}?`).pipe(filter(res => res)).subscribe(()=> {
          this.variantsArray.at(variantArrayIndex).patchValue({
            name: publicVariant.generateVariantNameFromCharts(this.user.account)
          })
        })
      }
    }

  }

  /**
   * Scrolls to bottom of element
   */
  scrollToBottom(element: ElementRef) {
      if(element.nativeElement){
        setTimeout( res =>element.nativeElement.scrollTop =Math.max(0, element.nativeElement.scrollHeight - element.nativeElement.offsetHeight)
          , 500)
      }
  }

  formValidationMessages(){
    if(!this.productForm.valid){
      if(this.productForm.errors){
        if(this.productForm.errors.duplicatedVariants){
          this._modalCtrl.info('More than one variant with the same name')
          return
        }
      }
      this._modalCtrl.info('Invalid Product Form')
    }
  }


  //sync is turned on but product needs to be changed
  onSyncProductChange() {
    this._modalCtrl.open(ProductSearchComponent, {private: false, public: true}).subscribe(
      product => {
        if (product) {
          this.mapSyncedProduct(product)
        }
      })
  }

  /**
   * Product Image Logic
   */

  //Drag and drop logic

  drop(event: CdkDragDrop<string[]>, array) {
    moveItemInArray(array, event.previousIndex, event.currentIndex)
  }


  dropVariant(event: CdkDragDrop<FormGroup[]>) {
    const dir = event.currentIndex > event.previousIndex ? 1 : -1;

    const from = event.previousIndex;
    const to = event.currentIndex;

    const temp = this.variantsArray.at(from);
    for (let i = from; i * dir < to * dir; i = i + dir) {
      const current = this.variantsArray.at(i + dir);
      this.variantsArray.setControl(i, current);
    }
    this.variantsArray.setControl(to, temp);
  }

  // remove image
  removeImage(index: number) {
    const imageToRemove = this.imagesToDisplay[index]
    //if new image uploaded
    if (imageToRemove.fileName) {
      //remove file from files to upload
      const fileIndex = this.productImagesToUpload.findIndex(file => file.name == imageToRemove.fileName)
      this.productImagesToUpload.splice(fileIndex, 1);
    }
    // remove index from image lists
    this.imagesToDisplay.splice(index, 1);
  }

  /**
 * Adds a product variant
 *
 * @param {ProductVariant|null} variant
 * @param {boolean} [template=false]
 * @param {boolean} [scrollToBottom=false] - Whether to scroll to the bottom or not.
 */

  addProductVariant(variant: ProductVariant= null, template= false, scrollToBottom: boolean= false) {
    this.variantsArray.markAllAsTouched();
    scrollToBottom && this.content.scrollToBottom(this.scrollSpeed)
    if (this.variantsArray.valid) {
      //this.scrollToBottom()
      const formControl = new FormGroup({
        ID: new FormControl(variant && variant.ID && !template ? variant.ID : null),
        name: new FormControl(variant?.name, [Validators.required]),
        sourceProductVariant: new FormControl(variant?.sourceProductVariant),
        usSize: new FormControl(variant?.usSize),
        ukSize: new FormControl(variant?.ukSize),
        jpSize: new FormControl(variant?.jpSize),
        euSize: new FormControl(variant?.euSize),
        usmSize: new FormControl(variant?.usmSize),
        uswSize: new FormControl(variant?.uswSize),
        gtin: new FormControl(variant?.gtin),
      })
      if (template ){
        formControl.patchValue({
          sourceProductVariant: variant,
          name: variant.canGenerateNameFromCharts(this.user.account) ? variant.generateVariantNameFromCharts(this.user.account) : variant?.name ,
          usSize:  variant.usSize ,
          ukSize:  variant.ukSize,
          jpSize:  variant.jpSize,
          euSize:  variant.euSize,
          usmSize:  variant.usmSize ,
          uswSize:  variant.uswSize ,
          gtin:   variant.gtin ,
        })
      }
      this.variantsArray.push(formControl)
    }
  }

  removeProductVariant(index) {
    // check if there is any inventory for this variant
    this._api.getInventoryListings(0,30, null, {'inventory.quantity':'1:','variant.ID': this.variantsArray.at(index).value.ID  }).pipe(
      mergeMap(resp => {
        if(resp.count > 0){
          return this._modalCtrl.confirm('This product variant has some inventory, are you sure you want to remove it ?')
        }
        return of(true)
      })
    ).pipe(filter(res => res))
      .subscribe(res => {
        this.variantsArray.removeAt(index)
      })
  }


  compareObjectsByIDFn(o1: Object, o2: Object): boolean {
    return o1 && o2 && o1['ID'] === o2['ID']
  }

  //PRODUCT CATEGORY FILTERING
  displayProductCategoryFn(productCategory: ProductCategory): string {
    return productCategory && productCategory.name ? productCategory.name : '';
  }

  private _productCategoryFilter(filteringValue: string): ProductCategory[] {
    filteringValue = filteringValue ? filteringValue : "" //handle if null
    const filterValue = filteringValue.toLowerCase();
    return this._productCategories.filter((productCategory: ProductCategory) => productCategory.name.includes(filterValue)).splice(0, 50)
  }

  onNewProductCategory() {
    this._modalCtrl.input({title: 'new product category', type: 'string'})
      .subscribe((res) => {
        if (res) {
          const newCategory = new ProductCategory({name: res, accountID: this.user.account.ID})
          this._productCategories.push(newCategory)
          this.productForm.patchValue({category: newCategory})
        }
      })
  }

  onUseTemplate() {
    this._modalCtrl.open(ProductSearchComponent, {private: false, public: true}).pipe(filter((res)=> res)).subscribe((product: Product) => {
      this.patchProductForm(product.ID, true)
    })
  }


  // on file uploaded behaviour
  onFileUploaded(evt: any) {
    // Iterate through each file that has been selected
    for (let idx = 0; idx < evt.target.files.length; idx++) {
      // For each file create a file reader object
      const rawFile = evt.target.files[idx];
      const reader = new FileReader();

      // File reader obj used to read image as data URL
      reader.onload = (_event: any) => {
        const image = new Image();
        // On image load, reduce quality
        image.onload = (_event: any) => {
          let fileName = new Date().getTime() + "." + rawFile.type.split("/")[1].toLowerCase()
          const elem = document.createElement('canvas');
          elem.width = image.width;
          elem.height = image.height;
          const ctx = elem.getContext('2d')!;
          // img.width and img.height will contain the original dimensions
          ctx.drawImage(image, 0, 0, image.width, image.height);
          ctx.canvas.toBlob((blob) => {
            const file = new File([blob!], fileName, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            this.productImagesToUpload.push(file);
          }, 'image/jpeg', 0.5);
          this.imagesToDisplay.push({fileName: fileName, url: elem.toDataURL('image/jpeg', 0.75)});
        };

        image.src = _event.target.result;
      };
      reader.readAsDataURL(rawFile);
    }
  }

  //FORM UPDATE FUNCTIONS
  generateImageRequests() {
    const requests = []

    const newImages = []
    const updateImages = []
    const deletedImages = []

    // New Images and Updated Images

    this.imagesToDisplay.map((image, index) => {
      //If image in list has no ID it means that it is new
      if (!image.ID) {
        newImages.push({
          src: image.url,
          position: index
        })
      }
      //If image in list has no ID it means that it is new
      else if (image.ID) {
        updateImages.push({
          ID: image.ID,
          src: image.url,
          position: index
        })
      }
    })
    //Check original product images and see which ones are not in the list anymore meaning that they have been removed
    this.product.images.map(_prodImage => {
      const imagePresent = !!this.imagesToDisplay.find(img => img.ID == _prodImage.ID)
      //no image found in updated images list
      if (!imagePresent) {
        deletedImages.push({
          ID: _prodImage.ID
        })
      }
    })

    //generate product requests
    //creation
    if (newImages.length > 0) {
      requests.push(this._api.createProductImages(this.productID, newImages))
    }
    //update
    if (updateImages.length > 0) {
      requests.push(this._api.updateProductImagesBulk(this.productID, updateImages))
    }
    //delete
    if (deletedImages.length > 0) {
      requests.push(this._api.deleteProductImagesBulk(this.productID, deletedImages))
    }
    return requests
  }

  generateVariantRequests() {
    const requests = []
    const variantsCreated = []
    const variantUpdates = []
    this.variantsArray.controls.map((variantControl, index) => {
      const variant = variantControl.value
      // variants with IDs need to be updated
      //IMPORTANT if product code changed update variants - ecommerce  channel purposes
      if ((variant.ID && variantControl.pristine == false )|| (variant.ID && !this.productForm.get('code').pristine) ) {
        variantUpdates.push(this.createVariantBody(variant,index))
      }
      // variants with no IDs need to be created
      else if (!variant.ID) {
        variantsCreated.push(this.createVariantBody(variant,index))
      }
    })
    // determine which variants have been deleted
    this.product.variants.map(_variant => {
      //check if variant is still present
      const variantFound = !!this.variantsArray.controls.find(control => control.value.ID == _variant.ID)
      if (!variantFound) {
        // not found so needs to be deleted
        variantUpdates.push({
          ID: _variant.ID,
          status: 'deleted'
        })
      }
    })
    //update
    if (variantUpdates.length > 0) {
      requests.push(this._api.updateVariants(this.productID, variantUpdates))
    }
    //delete
    if (variantsCreated.length > 0) {
      requests.push(this._api.createVariants(this.productID, variantsCreated))
    }
    return requests
  }

  createVariantBody(variant, index){
    const body = {
      name: variant.name,
      weight: this.productForm.value.weight,
      volume: this.productForm.value.volume,
      position: index,
      usSize:  variant.usSize ,
      ukSize:  variant.ukSize,
      jpSize:  variant.jpSize,
      euSize:  variant.euSize,
      usmSize:  variant.usmSize ,
      uswSize:  variant.uswSize ,
      gtin:   variant.gtin ,
      sourceProductVariantID: variant.sourceProductVariant ? variant.sourceProductVariant.ID : null
    }
    variant.ID ? body['ID'] = variant.ID :null
    return body
  }


  // after images are uploaded their (local) urls need to be replaced by the ones that were returned when the images were uploaded
  replaceImageURLs(imageURLs) {
    this.productImagesToUpload.map((file, index) => {
      const imgIndex = this.imagesToDisplay.findIndex(image => image.fileName == file.name)
      this.imagesToDisplay[imgIndex].url = imageURLs[index]
      this.imagesToDisplay[imgIndex].fileName = null
    })
    this.productImagesToUpload = []
  }
  //GETTERS
  get productFormData() {
    return this.productForm.getRawValue()
  }

  get variantsArray() {
    return this.productForm.get('variants') as FormArray;
  }

  //EXTRA

  commerceRedirect(){
    const shopifyStoreName = this.user.account.saleChannels.find(sc => sc.platform == 'shopify')
    if (shopifyStoreName) {
      const url = `https://${shopifyStoreName.shopifyStoreName}.myshopify.com/admin/products/${this.product.foreignID}`;
      window.open(url, '_blank').focus();
    }
  }

  isLoading(value, data = true, action = false){
    if (data){
      this.isLoadingData = value
    }
    if(action){
      this.isLoadingAction = value
    }
  }

  onOptionsClick () {
    const actions = []

    actions.push({
      icon: 'bolt',
      title: 'Use Template',
      description: '',
      disabled: false,
      key: 'template'
    })

    this._modalCtrl
      .actionSheet('Actions', actions)
      .pipe(
        filter((resp: IModalResponse) => resp.role == "submit"),
        map((resp: IModalResponse) => resp.data),
      )
      .subscribe((action: string) => {
        switch (action) {
          case 'template':
            this.onUseTemplate()
            break
        }
      })
  }

  /**
   * Open the size chart editor to update configured size charts
   *
   * which takes a variants form to be updated and sends it back
   */

  openSizeChartForm() {
    this._modalCtrl.open(SizeChartFormComponent, {variantsFormArray : this.variantsArray}).pipe(filter(res => res)).subscribe(data => {})
  }

  /**
   * Open the gtin editor to update configured gtin
   *
   * which takes a variants form to be updated and sends it back
   */

  openGTINForm() {
    this._modalCtrl.open(GtinFormComponent, {variantsFormArray : this.variantsArray}).pipe(filter(res => res)).subscribe(data => {})
  }
}



//VALIDATOR FUNCTION
export const validateSelector: ValidatorFn = (selectorFormControl: FormControl): ValidationErrors | null => {
  // Valid Product Category if input is an object: selected or create or the input hasn't been touched yet
  if (typeof selectorFormControl.value === 'object' || selectorFormControl.pristine) {
    return null
  } else {
    return {'invalidValue': true}
  }
};


function duplicateVariantsValidation(form: FormGroup) {
  const duplicatedVariants =  [];
  const variants = form.get('variants') as FormArray ;
  variants.controls.map((variant : FormControl, index) => {
    variants.controls.map(( _variant: FormControl, _index) => {
      if(_variant.value.name == variant.value.name && index != _index){
        duplicatedVariants.push(variant.value)
      }
    })
  })
  return duplicatedVariants.length == 0 ? null : { duplicatedVariants: true }
}




