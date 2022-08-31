import { Component, OnInit } from '@angular/core';
import { TTThemerService } from '../tt-themer/tt-themer.service';

@Component({
  selector: 'tt-settings',
  templateUrl: './tt-settings.component.html',
  styleUrls: ['./tt-settings.component.scss']
})
export class TtSettingsComponent implements OnInit {
  showSettings: boolean = false;

  constructor(public themer:TTThemerService) { }

  ngOnInit(): void {
  }
}