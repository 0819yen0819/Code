import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocApplierInfoComponent } from './soc-applier-info.component';

describe('SocApplierInfoComponent', () => {
  let component: SocApplierInfoComponent;
  let fixture: ComponentFixture<SocApplierInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocApplierInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocApplierInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
