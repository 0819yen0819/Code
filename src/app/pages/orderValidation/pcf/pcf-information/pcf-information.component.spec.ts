import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfInformationComponent } from './pcf-information.component';

describe('PcfInformationComponent', () => {
  let component: PcfInformationComponent;
  let fixture: ComponentFixture<PcfInformationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfInformationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
