import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlackMtnComponent } from './black-mtn.component';

describe('DplBlackComponent', () => {
  let component: BlackMtnComponent;
  let fixture: ComponentFixture<BlackMtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BlackMtnComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlackMtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
