import { Component, input } from '@angular/core';

@Component({
  selector: ' tt-value',
  imports: [],
  templateUrl: './tt-value.component.html',
  styleUrl: './tt-value.component.scss'
})
export class TtValueComponent {
  $title = input.required<string>({alias: 'title'});
}