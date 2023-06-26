import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NavigationPageRoutingModule } from './navigation-routing.module';

import { NavigationPage } from './navigation.page';
import { MaterialModule } from '../material.module';
import { CommonComponentsModule } from '../shared/components/components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NavigationPageRoutingModule,
    MaterialModule,
    CommonComponentsModule
  ],
  declarations: [NavigationPage]
})
export class NavigationPageModule {}
