import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ModalModule } from '../modal/modal.module';
import { MaterialModule } from '../../material.module';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';

const components = [
];
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    ModalModule,
    MaterialModule,
    CKEditorModule
  ],
  declarations: [
    ...components
  ],
  exports: [
    ...components
  ],
})
export class CommonComponentsModule {}
