import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtExtraBonusComponent } from './tt-extra-bonus.component';

describe('TtExtraBonusComponent', () => {
  let component: TtExtraBonusComponent;
  let fixture: ComponentFixture<TtExtraBonusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtExtraBonusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtExtraBonusComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
