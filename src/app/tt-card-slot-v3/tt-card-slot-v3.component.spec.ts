import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtCardSlotV3Component } from './tt-card-slot-v3.component';

describe('TtCardSlotV3Component', () => {
  let component: TtCardSlotV3Component;
  let fixture: ComponentFixture<TtCardSlotV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtCardSlotV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtCardSlotV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
