import { ComponentFixture, TestBed } from '@angular/core/testing';

import TtCardSlotComponent from './tt-card-slot.component';

describe('TtCardSlotComponent', () => {
  let component: TtCardSlotComponent;
  let fixture: ComponentFixture<TtCardSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtCardSlotComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TtCardSlotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
