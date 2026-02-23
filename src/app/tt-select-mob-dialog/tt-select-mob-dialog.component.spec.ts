import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtSelectMobDialogComponent } from './tt-select-mob-dialog.component';

describe('TtSelectMobDialogComponent', () => {
  let component: TtSelectMobDialogComponent;
  let fixture: ComponentFixture<TtSelectMobDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtSelectMobDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtSelectMobDialogComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
