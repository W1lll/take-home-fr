import { Component, OnInit } from '@angular/core'
import { ModalController, NavController, Platform } from '@ionic/angular'
import { environment } from 'src/environments/environment'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'
import { ModalService } from './shared/modal/modal.service'
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component'
import { Plugins } from '@capacitor/core'

import { UtilService } from './core/util.service'
import { UserService } from './core/user.service'

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit {
  private splashScreenOpen: boolean = false;
  environment = environment;

  constructor (
    private platform: Platform,
    private _modalCtrl: ModalService,
    private _utils: UtilService,
    private _user: UserService,
  ) {

    /***
     * Stop propagation on error "idpiframe_initialization_failed"
     * This error is happens inside zone.js because of the cookies are not enabled in incognito mode.
     * This method was the only way I found to capture de error, and stop propagation to the errorHandler.
     */
    window.onerror = (message, source, lineno, colno, error) => {
      let err: any = error
      if (err.error == "idpiframe_initialization_failed"){
        return true;
      }
    }

    // Add or remove the "dark" class based on if the media query matches
    function toggleDarkTheme (shouldAdd) {
      document.body.classList.toggle('dark-theme', shouldAdd)
    }
    // used to detect the preferred mode for the user (dark or light)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    toggleDarkTheme(prefersDark.matches) // set on init

    // Listen for any changes to the prefers-color-scheme media query
    prefersDark.addListener(mediaQuery => toggleDarkTheme(mediaQuery.matches))

    // listen for page width changes
    environment.screenType = window.innerWidth > 900 ? 'desktop' : 'mobile'
    window.addEventListener('resize', event => {
      environment.screenType = window.innerWidth > 900 ? 'desktop' : 'mobile'
    })

    // disable scrolling problem in input fields
    document.addEventListener("wheel", function(event){
      if( document.activeElement instanceof HTMLElement && document.activeElement['type'] === "number"){
        document.activeElement.blur();
      }
    });


    this.platform.ready().then(() => {
      environment.isCordovaAvailable = this.platform.is('cordova')

      if (this.platform.is('android') && this.platform.is('cordova')) {
        environment.platform = 'android'
      } else if (this.platform.is('ios') && this.platform.is('cordova')) {
        environment.platform = 'ios'
      } else {
        environment.platform = 'web';
        if (this.platform.is('mobileweb')){
          var checkInterval = setInterval(function (user) {
            if (user.account) {
              if (!user.account.isConsignor) {
                environment.showDownloadMobileAppNotification = true;
              }
              clearInterval(checkInterval);
            }
          }, 1000, this._user);
        }

      }

      if (environment.isCordovaAvailable) {
        Plugins.SplashScreen.hide() // use this to avoid white screen (splashscreen closing before app loads)
      }

      // use hook after platform dom ready
      GoogleAuth.initialize({
        clientId:
          '288612213063-vf7t5s8o3gb62cii767iikmthh5q9p6p.apps.googleusercontent.com',
        scopes: ['profile', 'email'],
        grantOfflineAccess: true
      })

      console.log("Calling splashscreen from platform ready")
      this.splashScreenOpen ? console.log("Splashscreen already open - abort") : null
      if (!this.splashScreenOpen) {
        this.splashScreenOpen = true
        this._modalCtrl.open(SplashScreenComponent, null, {
          cssClass: 'full-screen'
        }).subscribe(() => this.splashScreenOpen = false)
      }

    })

    // platform resume (tab-refocus)
    document.addEventListener('visibilitychange', () => {
      this.splashScreenOpen ? console.log("Splashscreen already open - abort") : null
      if (!document.hidden && !this.splashScreenOpen) {
        this.splashScreenOpen = true
        console.log("Calling splashscren from tab-refocus")
        this._modalCtrl.open(SplashScreenComponent, null, {
          cssClass: 'full-screen'
        }).subscribe(() => {
          this.splashScreenOpen = false
        })
      }
    })
  }

  ngOnInit (): void {

  }

}
