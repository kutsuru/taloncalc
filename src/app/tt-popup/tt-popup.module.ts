import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TTPopupButtonComponent } from './tt-popup-button.component';
import { TtPopupGroupComponent } from './tt-popup-group.component';
import { TtPopupComponent } from './tt-popup.component';

@NgModule({
  imports: [CommonModule, MatButtonModule, MatIconModule, MatCardModule],
  declarations: [
    TtPopupComponent,
    TtPopupGroupComponent,
    TTPopupButtonComponent,
  ],
  exports: [TtPopupComponent, TtPopupGroupComponent, TTPopupButtonComponent],
})
export class TTPopupModule {}
