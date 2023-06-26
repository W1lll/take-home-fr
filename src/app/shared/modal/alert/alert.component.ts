import { Component, Inject, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface IAlertComponent {
  message: string;
}

@Component({
  selector: 'app-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.css']
})
export class AlertComponent implements OnInit {
  @Input() data: IAlertComponent;

  constructor(
    private _modalCtrl: ModalController,
  ) { }

  ngOnInit(): void {
  }

  onSubmit(isConfirmed) {
    this._modalCtrl.dismiss(isConfirmed, 'submit');
  }

}
