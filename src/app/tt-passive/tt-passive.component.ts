import { Component, OnInit } from '@angular/core';
import { TTSessionInfoService } from '../core/tt-session-info.service';

@Component({
  selector: 'tt-passive',
  templateUrl: './tt-passive.component.html',
  styleUrls: ['./tt-passive.component.css'],
})
export class TtPassiveComponent implements OnInit {
  constructor(protected ttSessionInfoService: TTSessionInfoService) {}

  ngOnInit() {}
}
