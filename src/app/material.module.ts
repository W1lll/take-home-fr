

import { NgModule } from '@angular/core';
//Forms
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

//Angular Material Components
//Forms Control
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSelectModule } from '@angular/material/select';

//Navigation
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';

//Layout
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatStepperModule } from '@angular/material/stepper';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTreeModule } from '@angular/material/tree';

//Buttons & Indicators
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatNativeDateModule, MatRippleModule } from '@angular/material/core';
//Popups & Modals
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

//Data Table
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { CurrencyPipe } from './shared/currency.pipe';
import {PercentagePipe} from "./shared/percentage.pipe";
import {VariantPipe} from "./shared/variant.pipe";
import { CommaSpacePipe } from './shared/comma-space.pipe';

const modules = [
    //Forms
    FormsModule,
    ReactiveFormsModule,
    //Angular Material Components
    //Forms Control
    MatAutocompleteModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSliderModule,
    MatSelectModule,

    //Navigation
    MatMenuModule,
    MatSidenavModule,
    MatToolbarModule,

    //Layout
    MatCardModule,
    MatDividerModule,
    MatExpansionModule,
    MatStepperModule,
    MatListModule,
    MatGridListModule,
    MatTabsModule,
    MatTreeModule,

    //Buttons & Indicators
    MatButtonModule,
    MatButtonToggleModule,
    MatBadgeModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatRippleModule,

    //Popups & Modals
    MatBottomSheetModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,

    //Data Table
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatNativeDateModule
];
@NgModule({
  declarations: [
    CurrencyPipe,
    PercentagePipe,
    CommaSpacePipe,
    VariantPipe
  ],
  imports: [
    ...modules
  ],
  exports: [
    ...modules,
    CurrencyPipe,
    PercentagePipe,
    CommaSpacePipe,
    VariantPipe
  ]
})
export class MaterialModule { }
