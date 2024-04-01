import {
  Component,
  EventEmitter, HostListener, Input, OnChanges, OnInit,
  Output
} from '@angular/core';
import { TableCol } from 'src/app/core/model/data-table-cols';
import { ERPEXPDOInfo } from 'src/app/core/model/exp-ref-info';

@Component({
  selector: 'app-exp-ref-data-table',
  templateUrl: './exp-ref-data-table.component.html',
  styleUrls: ['./exp-ref-data-table.component.scss'],
})
export class ExpRefDataTableComponent implements OnInit, OnChanges {
  @Input() data: ERPEXPDOInfo[];
  @Input() cols: TableCol[];
  @Output() outputTargetData: EventEmitter<ERPEXPDOInfo[]> = new EventEmitter<
    ERPEXPDOInfo[]
  >();

  //> data selected
  selectedData: ERPEXPDOInfo[];

  viewpointWidth!: number;

  constructor() {
    this.viewpointWidth = window.innerWidth;
  }

  ngOnInit(): void {}

  ngOnChanges(): void {
    this.selectedData = new Array<ERPEXPDOInfo>();
  }

  @HostListener('window:resize', ['$event'])
  onViewPointWatcher(event: { target: { innerWidth: number; }; }): void {
    this.viewpointWidth = event.target.innerWidth;
  }

  onSelectedOutputEvent(): void {
    this.outputTargetData.emit(this.selectedData);
  }
}
