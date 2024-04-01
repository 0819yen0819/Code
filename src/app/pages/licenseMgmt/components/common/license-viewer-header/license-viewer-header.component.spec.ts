import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseViewerHeaderComponent } from './license-viewer-header.component';

describe('LicenseViewerHeaderComponent', () => {
  let component: LicenseViewerHeaderComponent;
  let fixture: ComponentFixture<LicenseViewerHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LicenseViewerHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LicenseViewerHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
