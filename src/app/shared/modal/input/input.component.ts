import { Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ModalController } from '@ionic/angular';

export interface IInputComponent {
  title: string;
  subtitle?: string;
  type: string;
  input?: string | number;
}

export interface InputResponse {
  data: any
  role: string // confirm | undefined
}

@Component({
  selector: 'app-input',
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnInit {
  @Input() data: IInputComponent;
  @ViewChild('inputEl') inputEl: ElementRef

  public inputForm = new FormGroup({
    input: new FormControl(null)
  })
  constructor(
    private _modalCtrl: ModalController,
  ) { }

  ngOnInit() {
    if (this.data.input) {
      this.inputForm.patchValue({
        input: this.data.input
      })
    }

    setTimeout(() => {
      this.inputEl.nativeElement.focus()
    }, 400)
  }

  onSubmit() {
    this._modalCtrl.dismiss(this.inputForm.value.input, 'submit');
  }

  onCancel(): void {
    this._modalCtrl.dismiss(null);
  }

}
