import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sc047ModifyRecordDialogComponent } from './sc047-modify-record-dialog.component';

describe('Sc047ModifyRecordDialogComponent', () => {
  let component: Sc047ModifyRecordDialogComponent;
  let fixture: ComponentFixture<Sc047ModifyRecordDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Sc047ModifyRecordDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(Sc047ModifyRecordDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
