import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcfHeaderComponent } from './pcf-header.component';

describe('PcfHeaderComponent', () => {
  let component: PcfHeaderComponent;
  let fixture: ComponentFixture<PcfHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcfHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PcfHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
