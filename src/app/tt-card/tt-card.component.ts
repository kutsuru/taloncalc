import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'tt-card',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule
  ],
  templateUrl: './tt-card.component.html',
  styleUrl: './tt-card.component.scss'
})
export class TtCardComponent {
  expanded = input<boolean>(true);
}
