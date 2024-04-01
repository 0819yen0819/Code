import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BafaDetailDialogComponent } from './bafa-detail-dialog.component';

describe('BafaDetailDialogComponent', () => {
  let component: BafaDetailDialogComponent;
  let fixture: ComponentFixture<BafaDetailDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BafaDetailDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BafaDetailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
