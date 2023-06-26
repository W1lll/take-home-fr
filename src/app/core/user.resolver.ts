import { Injectable } from '@angular/core';
import { Resolve, Router } from '@angular/router';
import { UserService } from './user.service';
import { ApiService } from './api.service';
import { mergeMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})

export class UserResolver implements Resolve<any> {
  /*
  Called after login-in successfully.
  Fetch the information associated with the user logged In
  */
  constructor(
    private _api: ApiService
    ) {}

  resolve() {
    return this._api.getAccountInfo()
  }
}
