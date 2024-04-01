import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaLicenseMtnComponent } from './soa-license-mtn.component';

describe('SoaLicenseMtnComponent', () => {
  let component: SoaLicenseMtnComponent;
  let fixture: ComponentFixture<SoaLicenseMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoaLicenseMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaLicenseMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
