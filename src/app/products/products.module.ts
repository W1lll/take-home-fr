import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductsPageRoutingModule } from './products-routing.module';

import { ProductsPage } from './products.page';
import {MatButtonModule} from "@angular/material/button";
import {MatTableModule} from "@angular/material/table";
import {MatSortModule} from "@angular/material/sort";
import {TableWrapperModule} from "../shared/table-wrapper/table-wrapper.module";
import {MatIconModule} from "@angular/material/icon";
import {FliproomListModule} from "../shared/fliproom-list/fliproom-list.module";
import {MaterialModule} from "../material.module";
import {GtinFormComponent} from "./gtin-form/gtin-form.component";
import {SizeChartFormComponent} from "./size-chart-form/size-chart-form.component";

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ProductsPageRoutingModule,
        MatButtonModule,
        TableWrapperModule,
        MatTableModule,
        MatSortModule,
        MatIconModule,
        FliproomListModule,
        MaterialModule
    ],
  declarations: [ProductsPage, GtinFormComponent, SizeChartFormComponent]
})
export class ProductsPageModule {}
