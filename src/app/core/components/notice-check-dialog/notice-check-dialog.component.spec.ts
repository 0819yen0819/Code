import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NoticeCheckDialogComponent } from './notice-check-dialog.component';

describe('NoticeCheckDialogComponent', () => {
  let component: NoticeCheckDialogComponent;
  let fixture: ComponentFixture<NoticeCheckDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NoticeCheckDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoticeCheckDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
