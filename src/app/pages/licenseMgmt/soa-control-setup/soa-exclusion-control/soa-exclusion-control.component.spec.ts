import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaExclusionControlComponent } from './soa-exclusion-control.component';

describe('SoaExclusionControlComponent', () => {
  let component: SoaExclusionControlComponent;
  let fixture: ComponentFixture<SoaExclusionControlComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaExclusionControlComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaExclusionControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
