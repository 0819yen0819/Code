import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTypeAuthComponent } from './form-type-auth.component';

describe('FormTypeAuthComponent', () => {
  let component: FormTypeAuthComponent;
  let fixture: ComponentFixture<FormTypeAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormTypeAuthComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FormTypeAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
