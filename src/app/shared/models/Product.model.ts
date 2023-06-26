import { Account } from 'src/app/core/user.service';
import {InventoryRecord} from "./InventoryRecord";

export class Product implements Object{
  ID: number
  accountID: number
  account: Account
  code: string
  foreignID: string
  title: string
  eanCode: string
  description: string
  pieces: number
  volume: number
  weight: number
  variant: string
  variants: ProductVariant[]
  category: ProductCategory
  isGeneric: boolean
  imageReference: string
  images: ProductImage[]
  public: boolean
  sourceProductID: number
  sourceProduct: Product
  stockxId: string
  status: string


  constructor(data: any) {
    if (data == null) return null;
    data.price = Number(data.price)
    data.category = new ProductCategory(data.category)
    data.sourceProduct = data.sourceProduct ? new Product(data.sourceProduct) : null
    data.variants =data.variants ? data.variants.map(variant => new ProductVariant(variant)) : null
    data.images = data.images ? data.images.map(image => new ProductImage(image)) : null
    return Object.assign(this, data);

  }

  toString() {
    return JSON.stringify({
      ID: this.ID,
      accountID: this.accountID,
      code: this.code,
      description: this.description,
      volume: this.volume,
      weight: this.weight,
      variant: this.variant,
      //category: this.category
    })
  }
}

export class ProductCategory {

  ID: number;
  accountID: number
  name: string;

  constructor(data: any) {
    if (data == null) return
    return Object.assign(this, data);
  }
}

export class ProductVariant {
  ID: number;
  productID: number
  product: Product
  foreignID: number
  name: string;
  price: number
  stockxId: string
  marketPrice: number
  sourceProductID: number
  sourceProductVariant: ProductVariant
  sourceProductVariantID :number
  inventory: InventoryRecord[]
  //size charts
  usSize: string
  ukSize: string
  jpSize: string
  euSize: string
  usmSize: string
  uswSize: string
  //extra
  gtin: string

  //checks if the sizechartsconfigs of account are available of on product variant
  canGenerateNameFromCharts(account: Account) {
    // sizecharts: 'uk', 'us', 'eu', 'jp'
    const sizesAvailable = []
    account.sizeChartConfig.map(chart=> {
      switch (chart) {
        case 'uk':
          this.ukSize ? sizesAvailable.push('uk') : null
          break;
        case 'us':
          this.usSize ? sizesAvailable.push('us') : null
          break;
        case 'eu':
          this.euSize ? sizesAvailable.push('eu') : null
          break;
        case 'jp':
          this.jpSize ? sizesAvailable.push('jp') : null
          break;
        default:
          break;
      }
    })
    if(account.sizeChartConfig.length == sizesAvailable.length){
      return true
    }


    return false
  }

  generateVariantNameFromCharts(account: Account) {
    let chartNames  = []
    account.sizeChartConfig.map(chart=> {
      switch (chart) {
        case 'uk':
          this.ukSize ? chartNames.push(this.ukSize.toUpperCase()) : null
          break;
        case 'us':
          this.usSize? chartNames.push(this.usSize.toUpperCase()) : null
          break;
        case 'eu':
          this.euSize ? chartNames.push(this.euSize.toUpperCase()) : null
          break;
        case 'jp':
          this.jpSize ? chartNames.push(this.jpSize.toUpperCase()) : null
          break;
        default:
          break;
      }
    })

    //parse variant name
    return chartNames.join(' - ')

  }


  constructor(data: any) {
    if (data == null) return
    data.product = new Product(data.product)
    data.sourceProductVariant = data.sourceProductVariant ?   new ProductVariant(data.sourceProductVariant) : null
    data.inventory = data.inventory ? data.inventory.map(invRecord => new InventoryRecord(invRecord)) : null
    return Object.assign(this, data);
  }
}

export class ProductImage{
  ID: number;
  createdAt: Date
  foreignID: string
  position: number;
  productID: number
  src: string

  constructor(data: any) {
    if (data == null) return
    return Object.assign(this, data);
  }
}
