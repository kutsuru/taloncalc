import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassAvatarComponent } from './class-avatar.component';

describe('ClassAvatarComponent', () => {
  let component: ClassAvatarComponent;
  let fixture: ComponentFixture<ClassAvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassAvatarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassAvatarComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
