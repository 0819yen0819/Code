import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaApprovingLicenseDialogComponent } from './soa-approving-license-dialog.component';

describe('SoaApprovingLicenseDialogComponent', () => {
  let component: SoaApprovingLicenseDialogComponent;
  let fixture: ComponentFixture<SoaApprovingLicenseDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaApprovingLicenseDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaApprovingLicenseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
