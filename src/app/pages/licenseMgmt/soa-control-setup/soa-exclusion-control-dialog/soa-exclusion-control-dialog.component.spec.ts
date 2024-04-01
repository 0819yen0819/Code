import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaExclusionControlDialogComponent } from './soa-exclusion-control-dialog.component';

describe('SoaExclusionControlDialogComponent', () => {
  let component: SoaExclusionControlDialogComponent;
  let fixture: ComponentFixture<SoaExclusionControlDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaExclusionControlDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaExclusionControlDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
