import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'tt-slider',
  imports: [
    MatSliderModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './tt-slider.component.html',
  styleUrl: './tt-slider.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TtSliderComponent {
  /* in- & outputs */
  value = model(0);
  min = input(0);
  max = input(100);
  displayWith = input((value: number) => value.toString());
  print = input(false);

  /* public functions */
  inc() {
    if (this.value() < this.max()) {
      this.value.update(_ => _ + 1);
    }
  }
  dec() {
    if (this.value() > this.min()) {
      this.value.update(_ => _ - 1);
    }
  }
  change(value: number) {
    this.value.set(value);
  }
}
