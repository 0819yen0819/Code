import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlByUserDialogComponent } from './soa-control-by-user-dialog.component';

describe('SoaControlByUserDialogComponent', () => {
  let component: SoaControlByUserDialogComponent;
  let fixture: ComponentFixture<SoaControlByUserDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlByUserDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlByUserDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
