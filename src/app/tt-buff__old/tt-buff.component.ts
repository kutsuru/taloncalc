import { Component, OnInit } from '@angular/core';
import { TTSessionInfoService } from '../core/tt-session-info.service';

@Component({
  selector: 'tt-buff-old',
  templateUrl: './tt-buff.component.html',
  styleUrls: ['./tt-buff.component.css'],
})
export class TtBuffComponentOld implements OnInit {
  constructor(protected ttSessionInfoService: TTSessionInfoService) {}

  ngOnInit() {}
}
