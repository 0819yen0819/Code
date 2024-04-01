import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaHeaderComponent } from './soa-header.component';

describe('SoaHeaderComponent', () => {
  let component: SoaHeaderComponent;
  let fixture: ComponentFixture<SoaHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
