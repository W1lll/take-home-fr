import { Pipe, PipeTransform } from '@angular/core';
import {UserService} from "../core/user.service";
import {ProductVariant} from "./models/Product.model";

@Pipe({
  name: 'variant'
})
export class VariantPipe implements PipeTransform {
  constructor(
    private user : UserService
  ) {}
  //TODO: iterate properly on this
  transform(variant: ProductVariant, ...args: unknown[]): string {
    //IMPROVE VARIANT DISPLAYING
    if (!(variant instanceof ProductVariant)) {
      return `N/A`
    }
    //return size chart generated name
    else if (variant.canGenerateNameFromCharts(this.user.account)){
      return variant.generateVariantNameFromCharts(this.user.account)
    }
    else {
      //return standard variant name
      return variant.name
    }
  }

}
