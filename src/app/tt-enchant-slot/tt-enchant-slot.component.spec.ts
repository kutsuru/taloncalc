import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtEnchantSlotComponent } from './tt-enchant-slot.component';

describe('TtEnchantSlotComponent', () => {
  let component: TtEnchantSlotComponent;
  let fixture: ComponentFixture<TtEnchantSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtEnchantSlotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtEnchantSlotComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
