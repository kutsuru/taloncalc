import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtSqiBonusComponent } from './tt-sqi-bonus.component';

describe('TtSqiBonusComponent', () => {
  let component: TtSqiBonusComponent;
  let fixture: ComponentFixture<TtSqiBonusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtSqiBonusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtSqiBonusComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
