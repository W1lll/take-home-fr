import { MarketplaceOffer } from './MarketplaceOffer';
import { Product, ProductVariant } from './Product.model';
import { Status } from './Status.model';
import { User } from './User.model';

export class MarketplaceListing {
  ID: number
  statusID: number
  productID: number
  productVariantID: number
  userID: number
  imageReference: string
  notes: string
  quantityClaimed: number
  quantityRequested: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
  type: string
  price: number
  user: User
  product: Product
  variant: ProductVariant
  marketplaceOffers?: MarketplaceOffer[]
  status: Status

  constructor(data: any) {
    if (data == null) return
    data.product =  new Product(data.product)
    data.variant = new ProductVariant(data.variant)
    data.user = data.user ? new User(data.user) : null
    data.marketplaceOffers = data.marketplaceOffers ? data.marketplaceOffers.map(offer => new MarketplaceOffer(offer)) : []
    data.tags = data.tags.split(",").filter(tag => tag !== "" && tag !== "[]")
    return Object.assign(this, data);
  }

  pendingOffers(): MarketplaceOffer[] {
    const offers = this.marketplaceOffers.filter(offer => offer.status.name === 'pending')
    return offers
  }

  approvedOffers(): MarketplaceOffer[] {
    const offers = this.marketplaceOffers.filter(offer => offer.status.name === 'approved')
    return offers
  }

  declinedOffers(): MarketplaceOffer[] {
    const offers = this.marketplaceOffers.filter(offer => offer.status.name === 'declined')
    return offers
  }

  get claimableQuantity(): number {
    return this.quantityRequested - this.quantityClaimed
  }

  //changes name of type if it is an external offer
  getCounterType(type){
    return type == 'wtb' ? 'sell' : 'buy'
  }
}

export interface MarketplaceListInterface {
  ID?: number
  statusID?: number
  productID?: number
  productVariantID?: number
  userID?: number
  imageReference?: string
  notes?: string
  quantityClaimed?: number
  quantityRequested?: number
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
  type?: string
  price?: number
}

