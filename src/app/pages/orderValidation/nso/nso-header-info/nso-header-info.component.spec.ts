import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NsoHeaderInfoComponent } from './nso-header-info.component';

describe('NsoHeaderInfoComponent', () => {
  let component: NsoHeaderInfoComponent;
  let fixture: ComponentFixture<NsoHeaderInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NsoHeaderInfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NsoHeaderInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
