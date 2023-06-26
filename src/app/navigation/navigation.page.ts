import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { environment } from 'src/environments/environment';
import { UserService } from '../core/user.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.page.html',
  styleUrls: ['./navigation.page.scss']
})
export class NavigationPage implements OnInit {
  public env = environment
  public menuType: string = environment.screenType == 'mobile' ? 'overlay' : 'push'
  public selectedOption: string;

  public navigationRoutes = [
    {
      id: 'products',
      path: '/products'
    },
  ]
  constructor (
    private menu: MenuController,
    private router: Router,
    public user: UserService
  ) { }

  ngOnInit() {
    this.router.events.subscribe((val) => {

      // see also
      if (val instanceof NavigationEnd) {
        this.navigationRoutes.map(navigationRoute => {
          if (val.url.includes(navigationRoute.path)) {
            this.selectedOption = navigationRoute.id
          }
        })
      }
    });
  }

  onButtonClick(id: string) {
    this.selectedOption = id
    this.menu.close()
  }
}
