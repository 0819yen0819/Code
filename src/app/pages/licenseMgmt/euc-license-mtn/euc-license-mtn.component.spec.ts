import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EucLicenseMtnComponent } from './euc-license-mtn.component';

describe('EucLicenseMtnComponent', () => {
  let component: EucLicenseMtnComponent;
  let fixture: ComponentFixture<EucLicenseMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EucLicenseMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EucLicenseMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
