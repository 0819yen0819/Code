import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlSetupByItemComponent } from './soa-control-setup-by-item.component';

describe('SoaControlSetupByItemComponent', () => {
  let component: SoaControlSetupByItemComponent;
  let fixture: ComponentFixture<SoaControlSetupByItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlSetupByItemComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlSetupByItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
