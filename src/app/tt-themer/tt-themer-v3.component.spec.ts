import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtThemerV3Component } from './tt-themer-v3.component';

describe('TtThemerV3Component', () => {
  let component: TtThemerV3Component;
  let fixture: ComponentFixture<TtThemerV3Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtThemerV3Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtThemerV3Component);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
