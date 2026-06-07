import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtAppHomeComponent } from './tt-app-home.component';

describe('TtAppHomeComponent', () => {
  let component: TtAppHomeComponent;
  let fixture: ComponentFixture<TtAppHomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtAppHomeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtAppHomeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
