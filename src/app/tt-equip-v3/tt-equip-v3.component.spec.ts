import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtEquipV3Component } from './tt-equip-v3.component';

describe('TtEquipV3Component', () => {
  let component: TtEquipV3Component;
  let fixture: ComponentFixture<TtEquipV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtEquipV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtEquipV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
