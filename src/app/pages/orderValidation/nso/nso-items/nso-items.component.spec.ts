import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NsoItemsComponent } from './nso-items.component';

describe('NsoItemsComponent', () => {
  let component: NsoItemsComponent;
  let fixture: ComponentFixture<NsoItemsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NsoItemsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NsoItemsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
