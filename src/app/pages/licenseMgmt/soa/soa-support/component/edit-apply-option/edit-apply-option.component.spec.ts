import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditApplyOptionComponent } from './edit-apply-option.component';

describe('EditApplyOptionComponent', () => {
  let component: EditApplyOptionComponent;
  let fixture: ComponentFixture<EditApplyOptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EditApplyOptionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditApplyOptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
