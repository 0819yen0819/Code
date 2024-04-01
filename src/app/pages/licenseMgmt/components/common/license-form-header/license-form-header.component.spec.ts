import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicenseFormHeaderComponent } from './license-form-header.component';

describe('LicenseFormHeaderComponent', () => {
  let component: LicenseFormHeaderComponent;
  let fixture: ComponentFixture<LicenseFormHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LicenseFormHeaderComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LicenseFormHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
