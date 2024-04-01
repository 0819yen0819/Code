import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddExpItemByRefDialogComponent } from './add-exp-item-by-ref-dialog.component';

describe('AddExpItemByRefDialogComponent', () => {
  let component: AddExpItemByRefDialogComponent;
  let fixture: ComponentFixture<AddExpItemByRefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddExpItemByRefDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddExpItemByRefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
