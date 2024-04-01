import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoaControlSetupCheckResultDownloadComponent } from './soa-control-setup-check-result-download.component';

describe('SoaControlSetupCheckResultDownloadComponent', () => {
  let component: SoaControlSetupCheckResultDownloadComponent;
  let fixture: ComponentFixture<SoaControlSetupCheckResultDownloadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SoaControlSetupCheckResultDownloadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SoaControlSetupCheckResultDownloadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
