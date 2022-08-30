import { Component, Input, OnInit } from '@angular/core';
import { TtPopupComponent } from './tt-popup.component';

@Component({
  selector: 'tt-popup-button',
  templateUrl: 'tt-popup-button.component.html',
})
export class TTPopupButtonComponent implements OnInit {
  @Input() popup!: TtPopupComponent;
  @Input() icon: string = 'menu';
  ngOnInit(): void {}
}
