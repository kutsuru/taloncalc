import { Component } from '@angular/core';
import { TTThemerService } from './tt-themer/tt-themer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public themer: TTThemerService){}
}