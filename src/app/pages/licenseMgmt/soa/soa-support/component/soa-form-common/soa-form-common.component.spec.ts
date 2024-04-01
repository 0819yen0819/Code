import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaFormCommonComponent } from './soa-form-common.component';

describe('SoaFormCommonComponent', () => {
  let component: SoaFormCommonComponent;
  let fixture: ComponentFixture<SoaFormCommonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaFormCommonComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaFormCommonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
