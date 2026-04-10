import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtEquipSlotComponent } from './tt-equip-slot.component';

describe('TtEquipSlotComponent', () => {
  let component: TtEquipSlotComponent;
  let fixture: ComponentFixture<TtEquipSlotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtEquipSlotComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtEquipSlotComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
