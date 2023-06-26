import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';

export interface IConfirmComponent {
  message: string;
}

@Component({
  selector: 'app-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.css']
})
export class ConfirmComponent implements OnInit {
  @Input() data: IConfirmComponent;

  constructor(
    private _modalCtrl: ModalController,
  ) { }

  ngOnInit(): void {
  }

  onSubmit(isConfirmed) {
    this._modalCtrl.dismiss(isConfirmed, 'submit');
  }

}
