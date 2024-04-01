import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImpExpLicenseMtnComponent } from './impexp-license-mtn.component';

describe('ImpExpLicenseMtnComponent', () => {
  let component: ImpExpLicenseMtnComponent;
  let fixture: ComponentFixture<ImpExpLicenseMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImpExpLicenseMtnComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImpExpLicenseMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
