import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlSetupByUserComponent } from './soa-control-setup-by-user.component';

describe('SoaControlSetupByUserComponent', () => {
  let component: SoaControlSetupByUserComponent;
  let fixture: ComponentFixture<SoaControlSetupByUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlSetupByUserComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlSetupByUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
