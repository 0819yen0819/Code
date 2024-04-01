import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { CommonApiService } from 'src/app/core/services/common-api.service';

@Component({
  selector: 'app-soa-control-setup-check-result-download',
  templateUrl: './soa-control-setup-check-result-download.component.html',
  styleUrls: ['./soa-control-setup-check-result-download.component.scss'],
})
export class SoaControlSetupCheckResultDownloadComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private commonApiService: CommonApiService
  ) {}

  ngOnInit(): void {
    this.activatedRoute.queryParams.pipe(take(1)).subscribe((res) => {
      this.commonApiService.downloadFile(res.fileId);
    });
  }
}
