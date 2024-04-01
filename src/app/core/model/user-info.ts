export interface UserInfo {
  adSubscriptionId: string | null;
  menuUrlPermissions?: {
    menuUrl: string;
    permissions: {
      ordinal: number;
      parentId: string;
      permissionCode: string;
      permissionDesc: string;
      permissionDescEn: string;
      permissionId: string;
      permissionUrl: string;
    }[];
  }[];
  tenant: string | null;
  tenantId: string | null;
  userCode: string | null;
  userEmail: string | null;
  userId: string | null;
  userName: string | null;
  userNameE: string | null;
  userStatus?: string | null;
  userToken: string | null;
}

export interface SimpleUserInfo {
  email?: string;
  fullName: string;
  nickName: string;
  staffCode: string;
}
