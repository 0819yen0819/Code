import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEccnSingleItemComponent } from './add-eccn-single-item.component';

describe('AddEccnSingleItemComponent', () => {
  let component: AddEccnSingleItemComponent;
  let fixture: ComponentFixture<AddEccnSingleItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEccnSingleItemComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEccnSingleItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
