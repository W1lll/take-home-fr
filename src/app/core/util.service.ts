import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilService {
  constructor(
  ) {}

  markFormGroupDirty(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((key) => {
      formGroup.get(key)?.markAsDirty();
    });
  }

  buildParams (
    pageIdx: number,
    pageSize: number,
    sort: string | null,
    filters
  ) {
    let params = new HttpParams()
    params = params.set('offset', `${pageIdx * pageSize}`)
    params = params.set('limit', `${pageSize}`)

    if (sort) {
      params = params.set('sort', `${sort}`)
    }

    for (var filterKey in filters) {
      if (filters[filterKey] == null) {
        params = params.set(filterKey, `!*`)
      } else {
        params = params.set(filterKey, `${filters[filterKey]}`)
      }
    }

    if (filters.groupBy) {
      params = params.set('groupBy', filters.groupBy.join(","))
    }

    return params
  }

  similarity(s1, s2) {
    var longer = s1;
    var shorter = s2;
    if (s1.length < s2.length) {
      longer = s2;
      shorter = s1;
    }
    var longerLength = longer.length;
    if (longerLength == 0) {
      return 1.0;
    }
    return (longerLength - this.editDistance(longer, shorter)) / parseFloat(longerLength);
  }

  editDistance(s1, s2) {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    var costs = new Array();
    for (var i = 0; i <= s1.length; i++) {
      var lastValue = i;
      for (var j = 0; j <= s2.length; j++) {
        if (i == 0)
          costs[j] = j;
        else {
          if (j > 0) {
            var newValue = costs[j - 1];
            if (s1.charAt(i - 1) != s2.charAt(j - 1))
              newValue = Math.min(Math.min(newValue, lastValue),
                costs[j]) + 1;
            costs[j - 1] = lastValue;
            lastValue = newValue;
          }
        }
      }
      if (i > 0)
        costs[s2.length] = lastValue;
    }
    return costs[s2.length];
  }

  getBase64(file: File | null): Observable<string> {
    return new Observable(observer => {
      if (!file) {
        observer.next(null);
        observer.complete();
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = function() {
        const result = reader.result as string;
        // Remove data:application/pdf;base64,
        const data = result.slice(result.indexOf('base64,') + 7);
        observer.next(data);
        observer.complete();
      };
    });
  }

  // currency conversion
  getExchangeRate(currencyFrom, currencyTo) {
    const exchangeRates = {
      'USD-USD': 1,
      'USD-GBP': 0.84,
      'USD-EUR': 0.95,
      'GBP-USD': 1.19,
      'GBP-GBP': 1,
      'GBP-EUR': 1.13,
      'EUR-USD': 1.05,
      'EUR-GBP': 0.88,
      'EUR-EUR': 1,
    }
    const exchangeString = `${currencyFrom}-${currencyTo}`.toUpperCase()

    return exchangeRates[exchangeString]
  }

  convertBase64ToBlob(b64data, contentType='application/pdf', sliceSize=512): Blob {
    // strip base64 with metadata
    b64data = b64data.slice(b64data.indexOf('base64,') + 7)
    
    const byteCharacters = atob(b64data);
    const byteArrays = [];
  
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
  
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
  
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
  
    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
  }
}
