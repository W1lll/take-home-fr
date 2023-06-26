import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentage'
})
export class PercentagePipe implements PipeTransform {
  constructor() {}

  transform(value: unknown, ...args: unknown[]): string {
    if (value == null || value === '') {
      return `N/A`
    }
    else {
      //convert to number if string
      value = typeof value == 'string' ? parseFloat(value) : value
      return `${(value as number).toFixed(0)} %`
    }


  }

}
