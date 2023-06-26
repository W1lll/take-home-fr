import { MarketplaceListing } from './MarketplaceList';
import { Status } from './Status.model';
import { User } from './User.model';

export class MarketplaceOffer {
  ID: number
  statusID: number
  userID: number
  price: number
  quantity: number
  notes: string
  user: User
  status: Status
  marketplaceListing?: MarketplaceListing
  cometChatGroup: any
  createdAt: Date
  updatedAt: Date


  constructor(data: any) {
    data.user = data.user ? new User(data.user) : null
    data.status = data.status ? new Status(data.status) : null
    data.marketplaceListing = data.marketplaceListing ? new MarketplaceListing(data.marketplaceListing) : null
    data.cometChatGroup = data.cometChatGroup ? JSON.parse(data.cometChatGroup): {}
    return Object.assign(this, data);
  }
}

export interface MarketplaceOfferInterface {
  ID?: number
  statusID?: number
  userID?: number
  price?: number
  quantity?: number
  notes?: string
  createdAt?: Date
  updatedAt?: Date
  status?: string
}


