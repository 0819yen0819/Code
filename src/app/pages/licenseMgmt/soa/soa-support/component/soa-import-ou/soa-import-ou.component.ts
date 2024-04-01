import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { AuthApiService } from 'src/app/core/services/auth-api.service';
import { SoaCommonService } from '../../../soa-common.service';
import { DocCols, GroupType } from './soa-import-ou-const';

@Component({
  selector: 'app-soa-import-ou',
  templateUrl: './soa-import-ou.component.html',
  styleUrls: ['./soa-import-ou.component.scss']
})
export class SoaImportOuComponent implements OnInit {
  @Output() ouInfoEmmiter = new EventEmitter<any>();

  ouInfo: any = {
    docMap: DocCols,
    docValue: 'Y',//'Y' | 'N' 

    groupTypeMap: GroupType,
    groupTypeValue: 'ALL Group', // 'Group OU' | 'OU' | 'ALL Group'

    ouSelectedValueCheckbox: [], // type = Group OU 時 extend選項 為checkbox;
    ouSelectedValueRadio: [], // type = OU 時 extend選項 為 radiobtn;
    ouSubSelectedValue: [],// type = OU 時 ， 選擇了某項radiobtn 會展開ou的checkbox ， 此為ou checkbox的選項

    ouMainList: [], // Group OU清單
    ouSubList: [], // Group OU下的OU清單
  }


  constructor(
    private authApiService: AuthApiService,
    public soaCommonService: SoaCommonService
  ) { }

  ngOnInit(): void {
    this.initData();
    this.recoverData();
  }

  async recoverData() {
    if (this.soaCommonService.currentState === 'Apply') { return; }
    const rsp = this.soaCommonService.getSOAFormData();
    console.log(rsp);
    this.ouInfo.docValue = rsp.isOriginal;
    if (rsp.ouType === 'GroupOU') {
      this.ouInfo.groupTypeValue = 'Group OU';
      rsp.groupDatas?.forEach(ou => {
        this.ouInfo.ouSelectedValueCheckbox.push(ou.groupCode);
      });
    }
    else if (rsp.ouType === 'OU') {
      this.ouInfo.groupTypeValue = 'OU';
      this.ouInfo.ouSelectedValueRadio = rsp.groupDatas[0].groupCode;
      await this.getOUbyGroup();
      this.ouInfo.ouSubSelectedValue = rsp.groupDatas[0].ouList.map(item => { return +item });
    }
    else if (rsp.ouType === 'ALL') {
      this.ouInfo.groupTypeValue = 'Group';
    }
  }

  async initData() {
    // 取得Group OU清單
    const groupQueryRes = await lastValueFrom(this.authApiService.groupQuery());
    this.ouInfo.ouMainList = groupQueryRes.groupList?.filter(group => { return group.groupName !== 'ALL' });
    this.ouInfoEmmiter.emit(this.ouInfo);
  }

  async getOUbyGroup() {
    // reset
    this.ouInfo.ouSubList = [];
    this.ouInfo.ouSubSelectedValue = [];
    // 取得 Group OU底下的OU清單
    const ouRes = await lastValueFrom(this.authApiService.getOUInfoByOUGroup(this.ouInfo.ouSelectedValueRadio))
    this.ouInfo.ouSubList = ouRes.body.ouList;
    this.ouInfo.ouSubList.forEach(ou => { this.ouInfo.ouSubSelectedValue.push(ou.ouCode) });
  }

  emitOuInfo() {
    this.ouInfoEmmiter.emit(this.ouInfo);
  }

}
