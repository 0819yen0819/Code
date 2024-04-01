import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfComponent } from './pcf.component';

describe('PcfComponent', () => {
  let component: PcfComponent;
  let fixture: ComponentFixture<PcfComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
