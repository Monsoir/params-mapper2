export enum MsrTypes {
  object = '[object Object]',
  array = '[object Array]',
  string = '[object String]',
  number = '[object Number]',
  function = '[object Function]',
}
  
export const MsrTypeOf = (obj: any) => Object.prototype.toString.call(obj);