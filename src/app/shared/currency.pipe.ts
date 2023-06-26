import { Pipe, PipeTransform } from '@angular/core';
import { Account, UserService } from 'src/app/core/user.service';

@Pipe({
  name: 'currency'
})
export class CurrencyPipe implements PipeTransform {
  constructor(
    public user: UserService) {
  }

  transform(value: unknown, ...args: unknown[]): string {
    if (value == null || value === '' || !value) {
      return 'N/A'
    }

    //convert to number if string
    value = typeof value == 'string' ? parseFloat(value) : value
    return `${this.user.account.currencySymbol}  ${(value as number).toFixed(2)}`
  }

}
