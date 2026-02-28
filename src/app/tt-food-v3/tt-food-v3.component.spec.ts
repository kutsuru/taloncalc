import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtFoodV3Component } from './tt-food-v3.component';

describe('TtFoodV3Component', () => {
  let component: TtFoodV3Component;
  let fixture: ComponentFixture<TtFoodV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtFoodV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtFoodV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
