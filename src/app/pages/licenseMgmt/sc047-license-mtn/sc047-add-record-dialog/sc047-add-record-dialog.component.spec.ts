import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sc047AddRecordDialogComponent } from './sc047-add-record-dialog.component';

describe('Sc047AddRecordDialogComponent', () => {
  let component: Sc047AddRecordDialogComponent;
  let fixture: ComponentFixture<Sc047AddRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Sc047AddRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sc047AddRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
