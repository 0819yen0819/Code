import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddSc047V2ItemByRefDialogComponent } from './add-sc047-v2-item-by-ref-dialog.component';

describe('AddSc047V2ItemByRefDialogComponent', () => {
  let component: AddSc047V2ItemByRefDialogComponent;
  let fixture: ComponentFixture<AddSc047V2ItemByRefDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AddSc047V2ItemByRefDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddSc047V2ItemByRefDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
