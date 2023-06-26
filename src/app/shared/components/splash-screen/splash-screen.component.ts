import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService, SystemInfo } from 'src/app/core/api.service';
import { UtilService } from 'src/app/core/util.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent implements OnInit {

  constructor(
    private _modalCtrl: ModalController,
    private _util: UtilService,
    private _api: ApiService
  ) { }

  ngOnInit() {}

  ionViewDidEnter() {
    //check for update
    console.log("Checking for updates..")
    this._api.getSystemInfo().subscribe((resp: SystemInfo) => {
      console.log("System Info", resp)
      environment.latestVersion = resp.appVersion
      this.checkIfCanProceed(resp)
    })
  }

  checkIfCanProceed(resp) {
    console.log("checkIfCanProceed")

    if (!resp.allowAccess) {
      alert("The server is currently under maintenance. Sorry for any incovenience")
      this.checkIfCanProceed(resp)
    } else if (environment.appVersion < environment.latestVersion ) {
      alert(`App Version ${environment.appVersion}. Please update your app to the lastest version (${environment.latestVersion}) to continue use it`)
      if (environment.platform == "android") {
        window.open('market://details?id=io.fliproom.mobile')
      } else if (environment.platform == "ios") {
        window.location.href = 'https://apps.apple.com/us/app/fliproom/id6443529935'
      } else {
        window.location.href = `?t=${new Date().getTime()}&eraseCache=true`;
      }
    } else {
      this._modalCtrl.dismiss(null, 'submit');
    }
  }

}
