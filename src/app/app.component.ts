import { Component } from '@angular/core';
import { appLogoData } from './app-logo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  appLogoData = appLogoData;
}
