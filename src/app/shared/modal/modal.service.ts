import { Component, Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { ActionSheetController, AnimationController, ModalController, ToastController } from '@ionic/angular';
import { Observable, from } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AlertComponent } from './alert/alert.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { HelpPanelComponent } from './help-panel/help-panel.component';
import { IInputComponent, InputComponent } from './input/input.component';

export interface IActionsSheetAction {
  icon?: string
  title: string
  description?: string
  disabled?: boolean
  key: string
}

export interface IModalResponse {
  data: any;
  role: string | undefined;
}

@Injectable()

export class ModalService {
  private _modalOpen: any = null

  constructor(
    private _toastController: ToastController,
    public dialog: MatDialog,
    private animationCtrl: AnimationController,
    private modalController: ModalController,
    public actionSheetController: ActionSheetController
  ) { }

  open(modalComponent: any, data: { [key: string]: any;} = {}, configs: any = {}): Observable<any> {
    return from(this.openModal(modalComponent, data, configs)).pipe(
      filter((resp: IModalResponse) => resp.role == 'submit'),
      map((resp: IModalResponse) => resp.data)
    )
  }

  async openModal(modalComponent: any, data: { [key: string]: any;} = {}, configs: any = {}): Promise<any> {
    const modalLeaveAnimation = (baseEl: any) => {
      return this.animationCtrl.create('fadeOut')
        .addElement(baseEl)
        .duration(200)
        .easing('ease-in-out')
        .fromTo('opacity', '1', '0');
    }

    const modalOpen = await this.modalController.create({
      component: modalComponent,
      componentProps: {data: data},
      cssClass: configs.cssClass,
      backdropDismiss: true,
      swipeToClose:true,
      leaveAnimation: modalLeaveAnimation
    })

    modalOpen.present()
    const dismiss = await modalOpen.onDidDismiss()
    if(dismiss.role == 'backdrop'){
      dismiss.role = 'submit'
      dismiss.data = null
    }
    return dismiss
  }

  actionSheet(header, actions: IActionsSheetAction[]): Observable<IModalResponse> {
    return from(this._actionSheet(header, actions))
  }

  async _actionSheet(header: string, actions: IActionsSheetAction[]) {
    const _actions = []
    actions.map((action: IActionsSheetAction) => _actions.push({
      text: action.title,
      id: action.key,
      cssClass: action.disabled ? ['disabled'] : [],
      //icon: action.icon,
      data: {
        key: action.key,
        disabled: action.disabled,
        disabledMessage: action.description
      }
    }))


    const actionSheet = await this.actionSheetController.create({
      header: header,
      cssClass: 'my-custom-class',
      buttons: _actions
    });

    await actionSheet.present();
    const {data, role} = await actionSheet.onDidDismiss()

    if (data === undefined) {
      return {data: null, role: null}
    } else if (data.disabled) {
      this.warning(data.disabledMessage)
      return {data: null, role: null}
    } else {
      return {data: data.key, role: 'submit'}
    }
  }

  error(message: string) {
    this._openSnackbar(message, 'error')
  }

  info(message: string) {
    this._openSnackbar(message, 'info')
  }

  warning(message: string) {
    this._openSnackbar(message, 'warning')
  }

  success(message: string) {
    this._openSnackbar(message, 'success')
  }

  confirm(message: string) {
    return this.open(ConfirmComponent, {'message': message}, {cssClass: 'custom'})
  }

  alert(message: string) {
    return this.open(AlertComponent, {'message': message}, {cssClass: 'custom'})
  }

  help(serviceName: string) {
    return this.open(HelpPanelComponent, {'serviceName': serviceName}, {cssClass: 'custom'})
  }

  input(data: IInputComponent): Observable<any> {
    return this.open(InputComponent, data, {cssClass: 'custom'})
  }

  private async _openSnackbar(message: string, className: string) {
    const toast = await this._toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      cssClass: className,
      buttons: ['Got It!']
    });

    await toast.present();
  }
  close() {
    this._modalOpen.close()
  }
}
