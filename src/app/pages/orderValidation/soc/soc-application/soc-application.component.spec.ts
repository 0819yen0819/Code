import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocApplicationComponent } from './soc-application.component';

describe('SocApplicationComponent', () => {
  let component: SocApplicationComponent;
  let fixture: ComponentFixture<SocApplicationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocApplicationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
