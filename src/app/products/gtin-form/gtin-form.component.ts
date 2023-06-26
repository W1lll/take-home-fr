import {Component, Input, OnInit} from '@angular/core';
import {UserService} from "../../core/user.service";
import {ModalController} from "@ionic/angular";
import {ModalService} from "../../shared/modal/modal.service";
import {FormArray, FormGroup} from "@angular/forms";
import {ProductVariant} from "../../shared/models/Product.model";
import {environment} from 'src/environments/environment';

export interface IGtinForm {
  variantsFormArray: FormArray,
}

@Component({
  selector: 'app-gtin-form',
  templateUrl: './gtin-form.component.html',
  styleUrls: ['./gtin-form.component.scss'],
})


/**
 * Product GTIN Form Editor
 *
 * Purpose:
 *
 * 1. receives a  variant form array :
 *        [{
 *            ID: number
 *            name: string
 *            weight: number
 *            volume: number
 *            position: number
 *            usSize:  string
 *            ukSize:  string
 *            jpSize:  string
 *            euSize:  string
 *            usmSize:  string
 *            uswSize:  string
 *            gtin:   string
 *            sourceProductVariantID: number
 *        }]
 * 2. Allows variants gtins to be edited and added
 * 3. When saved will return a Form Array which will be patched when received by parent component
 */

export class GtinFormComponent implements OnInit {

  @Input() data: IGtinForm

  constructor(
    private _user: UserService,
    private _modalCtrl: ModalController,
    private _modal: ModalService,
  ) { }

  public environment = environment
  public gtinForm = new FormGroup({
    variants : new FormArray([])
  })

  ngOnInit() {
    this.gtinForm.controls['variants'] = this.data.variantsFormArray

  }

  onCancel() {
    this._modalCtrl.dismiss();
  }

  onSubmit() {
    this._modalCtrl.dismiss({updatedVariantsFormArray: this.gtinForm.controls['variants']})
  }

  generateUpdatedVariant(rawVariant){
    return new ProductVariant(rawVariant)
  }


}
