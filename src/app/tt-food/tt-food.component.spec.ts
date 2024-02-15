import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtFoodComponent } from './tt-food.component';

describe('TtFoodComponent', () => {
  let component: TtFoodComponent;
  let fixture: ComponentFixture<TtFoodComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtFoodComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TtFoodComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
