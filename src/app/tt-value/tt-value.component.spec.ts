import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TtValueComponent } from './tt-value.component';

describe('TtValueComponent', () => {
  let component: TtValueComponent;
  let fixture: ComponentFixture<TtValueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TtValueComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TtValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
