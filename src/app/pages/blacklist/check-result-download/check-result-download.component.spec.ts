import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckResultDownloadComponent } from './check-result-download.component';

describe('DplBlackComponent', () => {
  let component: CheckResultDownloadComponent;
  let fixture: ComponentFixture<CheckResultDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckResultDownloadComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckResultDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
