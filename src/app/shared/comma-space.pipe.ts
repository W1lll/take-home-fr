import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'commaSpace'
})
export class CommaSpacePipe implements PipeTransform {
    transform(value: string): string {
        return value.split(',').join(', ');
    }
}