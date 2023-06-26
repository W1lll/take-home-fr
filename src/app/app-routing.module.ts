import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { UserResolver } from './core/user.resolver';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./navigation/navigation.module').then( m => m.NavigationPageModule),
    resolve: { user: UserResolver }
  },
  {path: '**', redirectTo: ''},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
