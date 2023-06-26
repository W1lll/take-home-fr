import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule, Meta } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS,
} from '@angular/common/http';

import { AnimationBuilder, createAnimation, IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material.module';
import { ModalModule } from './shared/modal/modal.module';


//import { NFC, Ndef } from '@awesome-cordova-plugins/nfc/ngx';
import { ProductSearchComponent } from './shared/components/product-search/product-search.component';
import { FliproomListModule } from './shared/fliproom-list/fliproom-list.module';


export const customAnimation = (_: HTMLElement, opts: any) => {
  // create root transition
  const rootTransition = createAnimation()
                          .duration(200)
                          .easing('ease-in-out')

  const enterTransition = createAnimation().addElement(opts.enteringEl);
  const exitTransition =  createAnimation().addElement(opts.leavingEl);

  enterTransition.fromTo('opacity', '0', '1');
  exitTransition.fromTo('opacity', '1', '0');

  rootTransition.addAnimation([enterTransition, exitTransition]);
  return rootTransition;
}


@NgModule({
  declarations: [
    AppComponent,
    ProductSearchComponent
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      navAnimation: customAnimation //Overrides the default "animation" of all ion-nav and ion-router-outlet across the whole application.
    }),
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MaterialModule,
    ModalModule,
    FliproomListModule,
  ],
  providers: [
    Meta,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
