import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtSliderComponent } from './tt-slider.component';

describe('TtSliderComponent', () => {
  let component: TtSliderComponent;
  let fixture: ComponentFixture<TtSliderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtSliderComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtSliderComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
