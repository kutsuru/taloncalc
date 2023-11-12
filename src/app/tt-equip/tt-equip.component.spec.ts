import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtEquipComponent } from './tt-equip.component';

describe('TtEquipComponent', () => {
  let component: TtEquipComponent;
  let fixture: ComponentFixture<TtEquipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TtEquipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtEquipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
