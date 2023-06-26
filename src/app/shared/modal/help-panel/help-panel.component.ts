import { Component, Inject, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ModalController } from '@ionic/angular';
import { environment } from 'src/environments/environment';

export interface IHelpPanelComponent {
  serviceName: string;
}

@Component({
  selector: 'app-help-panel',
  templateUrl: './help-panel.component.html',
  styleUrls: ['./help-panel.component.scss']
})
export class HelpPanelComponent implements OnInit {
  @Input() data: IHelpPanelComponent;

  private resourcesDatabase = {
    'products': [
      {id: 'import-product', title: 'Import Product', mobileVideoUrl: 'https://www.youtube.com/embed/6u52sY2isJY', webVideoUrl: 'https://www.youtube.com/embed/_FfvgTVKCxM'}
    ],
    'inventory': [
      {id: 'add-inventory', title: 'Add Inventory', mobileVideoUrl: 'https://www.youtube.com/embed/NFCVShOtHCI', webVideoUrl: 'https://www.youtube.com/embed/XKKjb9XuyDQ'}
    ],
    'orders': [
      {id: 'create-order', title: 'Record Sale', mobileVideoUrl: 'https://www.youtube.com/embed/uyswedS0cik', webVideoUrl: 'https://www.youtube.com/embed/pw7ILUvnOyI'}
    ]
  }

  public resources = []
  public envi = environment
  constructor(
    private _modalCtrl: ModalController,
    private _sanitizer: DomSanitizer,
    
  ) { }

  ngOnInit(): void {

    for (var res of this.resourcesDatabase[this.data.serviceName]) {
      // build resources to display from db of resources
      this.resources.push({id: res.id, title: res.title, url: this._sanitizer.bypassSecurityTrustResourceUrl(environment.platform == 'web' ? res.webVideoUrl : res.mobileVideoUrl)})
    }
  }

  onSubmit(isConfirmed) {
    this._modalCtrl.dismiss(isConfirmed, 'submit');
  }

}
