export enum ResponseCodeEnum {

  SUCCESS = 'Success',
  NO_PERMISSION = 'NoPermission',
  TENANT_NOT_FOUND = 'TenantNotFound',
  AUTHGROUPID_NOT_FOUND = 'AuthGroupIdNotFound',
	AUTHGROUPNAME_ALREADY_EXISTS = 'AuthGroupNameAlreadyExists',
	ROLEID_NOT_FOUND = 'RoleIdNotFound',
	ROLENAME_ALREADY_EXISTS = 'RoleNameAlreadyExists',
  FILEID_NOT_FOUND = 'FileIdNotFound',
  USER_NOT_FOUND = 'UserNotFound',
  USER_ALREADY_EXISTS = 'UserAlreadyExists',
  EMPLOYEE_NOT_FOUND = 'HrEmpNotFound',
  LICENSEMASTER_ALREADY_EXISTS = 'LicenseMasterAlreadyExists',

  CUSTOMER_NOT_FOUND = 'CustomerNotFound',
  CUSTOMER_ALREADY_EXISTS_BLACK = 'CustomerAlreadyExistsBlack',

  PRECISION_EXCEPTION = 'PrecisionException',
  DATA_EXCEPTION = 'DataException',
  BPAAS_EXCEPTION = 'BPaaSException',

  ARGUMENT_NOT_VALID_EXCEPTION = 'ArgumentNotValidException',
  INTERNAL_SERVER_ERROR = 'InternalServerError',

}
