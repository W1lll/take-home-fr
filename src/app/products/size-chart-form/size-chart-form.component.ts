import {Component, Input, OnInit} from '@angular/core';
import {UserService} from "../../core/user.service";
import {ModalController} from "@ionic/angular";
import {ModalService} from "../../shared/modal/modal.service";
import {FormArray, FormControl, FormGroup} from "@angular/forms";
import {ProductVariant} from "../../shared/models/Product.model";
import {environment} from 'src/environments/environment';



export interface ISizeChartForm {
  variantsFormArray: FormArray,
}

/**
 * Size Chart Form Editor
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
 * 2. Allows variants size charts to be viewed and edited
 * 3. When saved will return a Form Array which will be patched when received by parent component
 */
@Component({
  selector: 'app-size-chart-form',
  templateUrl: './size-chart-form.component.html',
  styleUrls: ['./size-chart-form.component.scss'],
})
export class SizeChartFormComponent implements OnInit {


  @Input() data: ISizeChartForm


  constructor(
    private _user: UserService,
    private _modalCtrl: ModalController,
    private _modal: ModalService,
  ) { }

  public environment = environment
  public sizeChartForm = new FormGroup({
    variants : new FormArray([])
  })

  public sizeChartRegions = []
  public currentRegionsSelected = []

  ngOnInit() {
    this.sizeChartForm.controls['variants'] = this.data.variantsFormArray
    //set size chart regions available for edit to the ones selcted by the user
    this.sizeChartRegions = this.configuredRegions
    this.currentRegionsSelected = environment.screenType == 'mobile' ? [this.configuredRegions[0]] : this.configuredRegions
  }


  // change selected region mobile based
  onSegmentChanged(evt){
    this.currentRegionsSelected = [evt.detail.value]
  }

  //checks if the region is selected on the account
  isAccountSelectedRegion(region){
    return !!this.configuredRegions.find(_region=> _region == region )
  }


  //checks if the region is selected on the account
  isRegionSelected(region){
    return !!this.currentRegionsSelected.find(_region=> _region == region )
  }

  //Size chart regions configured on the account
  get configuredRegions(){
    return this._user.account.sizeChartConfig
  }

  //display real time value of changed variant to show user how it will show once variant size charts are changed
  generateUpdatedVariant(rawVariant){
    return new ProductVariant(rawVariant)
  }


  onCancel() {
    this._modalCtrl.dismiss();
  }

  onSubmit() {
    //update actual variant names stored
    this._modal.confirm('Do you want to update the variant names to the ones displayed from the size charts?').subscribe(res => {
      if(res) {
        this.sizeChartForm.get('variants')['controls'].map((variantControl: FormControl) => {
          const variant = this.generateUpdatedVariant(variantControl.value)
          if(variant.canGenerateNameFromCharts(this._user.account)){
            variantControl.get('name').setValue(variant.generateVariantNameFromCharts(this._user.account))
            //mark variant as dirty so it can be saved
            variantControl.markAsDirty()
          }
        })
      }
      this._modalCtrl.dismiss({updatedVariantsFormArray: this.sizeChartForm.controls['variants']})
    })
  }

  onResize($event: any) {
    //checking that screentype has changed to mobile
    if(environment.screenType == 'mobile' && this.currentRegionsSelected.length > 1){
      this.currentRegionsSelected = [this.sizeChartRegions[0]]
    }
    //checking screen type has changed from mobile to desktop
    else if(environment.screenType != 'mobile' && this.currentRegionsSelected.length == 1){
      this.currentRegionsSelected = this.sizeChartRegions
    }

  }

}
