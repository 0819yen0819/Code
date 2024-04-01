import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EucComponent } from './euc.component';

describe('EucComponent', () => {
  let component: EucComponent;
  let fixture: ComponentFixture<EucComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EucComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EucComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
