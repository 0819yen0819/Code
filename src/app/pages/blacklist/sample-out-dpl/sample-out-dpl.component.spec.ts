import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SampleOutDPLComponent } from './sample-out-dpl.component';

describe('SampleOutDPLComponent', () => {
  let component: SampleOutDPLComponent;
  let fixture: ComponentFixture<SampleOutDPLComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SampleOutDPLComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SampleOutDPLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
