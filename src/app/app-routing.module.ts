import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChangelogComponent } from './changelog/changelog.component';
import { DbRequestComponent } from './db-request/db-request.component';
import { PvmComponent } from './pvm/pvm.component';

const routes: Routes = [
  {
    path: '',
    component: PvmComponent,
  },
  {
    path: 'changelog',
    component: ChangelogComponent,
  },
  {
    path: 'request',
    component: DbRequestComponent,
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
