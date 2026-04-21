import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtEquipSlotPopupComponent } from './tt-equip-slot-popup.component';

describe('TtEquipSlotPopupComponent', () => {
  let component: TtEquipSlotPopupComponent;
  let fixture: ComponentFixture<TtEquipSlotPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtEquipSlotPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtEquipSlotPopupComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
