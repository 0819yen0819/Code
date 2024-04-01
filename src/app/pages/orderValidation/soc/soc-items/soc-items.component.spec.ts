import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocItemsComponent } from './soc-items.component';

describe('SocItemsComponent', () => {
  let component: SocItemsComponent;
  let fixture: ComponentFixture<SocItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SocItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SocItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
