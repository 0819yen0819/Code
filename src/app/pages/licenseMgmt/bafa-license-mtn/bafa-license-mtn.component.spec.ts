import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BafaLicenseMtnComponent } from './bafa-license-mtn.component';

describe('BafaLicenseMtnComponent', () => {
  let component: BafaLicenseMtnComponent;
  let fixture: ComponentFixture<BafaLicenseMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BafaLicenseMtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BafaLicenseMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
