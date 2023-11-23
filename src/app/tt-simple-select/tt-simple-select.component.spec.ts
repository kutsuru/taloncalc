import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtSimpleSelectComponent } from './tt-simple-select.component';

describe('TtSimpleSelectComponent', () => {
  let component: TtSimpleSelectComponent;
  let fixture: ComponentFixture<TtSimpleSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TtSimpleSelectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtSimpleSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
