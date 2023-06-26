import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FliproomListComponent } from './fliproom-list.component';
import { SearchBarModule } from '../search-bar/search-bar.module';
import {IonicModule} from "@ionic/angular";


@NgModule({
  declarations: [
    FliproomListComponent
  ],
    imports: [
        CommonModule,
        SearchBarModule,
        IonicModule
    ],
  exports: [
    FliproomListComponent
  ]
})
export class FliproomListModule { }
