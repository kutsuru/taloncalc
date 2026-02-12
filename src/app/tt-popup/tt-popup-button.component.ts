import { Component, Input, OnInit } from '@angular/core';
import { TtPopupComponent } from './tt-popup.component';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'tt-popup-button',
    templateUrl: 'tt-popup-button.component.html',
    standalone: true,
    imports: [MatMiniFabButton, MatIcon],
})
export class TTPopupButtonComponent implements OnInit {
  @Input() popup!: TtPopupComponent;
  @Input() icon: string = 'menu';
  ngOnInit(): void {}
}
