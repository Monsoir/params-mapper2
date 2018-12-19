import { MsrTypeOf, MsrTypes } from "./TypeOf";

export type TransformMetaInfo = {
  /**
   * value 为返回到服务端的字段名称
   */
  paramKey: string;

  /**
   * 用于将原始数据的转换
   * 
   * 可以传入多个转换方法，多个转换方法按正序执行
   * 
   * 转换方法的第一个参数为前一个转换方法结果，第二个参数为原始数据
   */
  reduceRule?: {
    reducers: ((acc: any, originValue: any) => any)[],
  };

  /**
   * 验证值是否合法的函数
   */
  validator?: (param1: any, ...$n: any[]) => Boolean;

  /**
   * 验证失败的提示
   */
  validationFailureMessage?: string;

  /**
     * 是否总是保留参数，有些接口没值时不需要传
     *
     * 当此值为 true 时，总是传， false 时忽略空值
     * 空置情况：普通对象 -> 自有属性个数为 0, 数组 -> 长度为 0, 字符串，数字 -> 零值
     *
     * 默认是 false
     */
  alwaysKeep?: Boolean;

  /**
   * 该值是否可选，默认为 false
   * 
   * 当值为可选时，校验方法只在该字段有值时才会进行检验
   */
  optional?: Boolean;
}

export interface ITransformable {
  getParams(): {
    [key: string]: any,
  };
}

type JSONLikeObject = {
  [key: string]: any;
};

export type TransformMetaInfoDict = {
  [key: string]: TransformMetaInfo;
}

class ParamObject implements ITransformable {
  payload: JSONLikeObject = {};
  metaInfo: TransformMetaInfoDict;
  constructor(metaInfo: TransformMetaInfoDict) {
    this.metaInfo = metaInfo;
  }

  getParams(): JSONLikeObject {
    const { metaInfo, payload } = this;
    if (!metaInfo) {
      throw new Error('transform meta info should be provided');
    }
    if (!payload) {
      throw new Error('transform payload should be an object');
    }

    const params = Object.keys(metaInfo).reduce((acc: JSONLikeObject, currentKey: string) => {
      let value = (payload || {})[currentKey];
      const transformRule = metaInfo[currentKey];

      // 数据转换
      const { reduceRule } = transformRule;
      if (reduceRule) {
        const { reducers } = reduceRule;
        if (reducers && Array.isArray(reducers) && reducers.length > 0) {
          let reducedValue = value;
          reducers.forEach((ele) => {
            reducedValue = ele(reducedValue, value);
          });
          value = reducedValue;
        }
      }

      // 校验
      const { validator, validationFailureMessage, optional } = transformRule;
      if (validator) {
        const validated = validator(value);
        if (!validated) {
          /**
           * 校验失败的情况
           * - 零值
           *   - optional -> pass
           *   - non-optional -> throw
           * - 有值
           *   - optional -> throw
           *   - non-optional -> throw
           */
          // if (value && !optional) {
          //   throw new Error(validationFailureMessage)
          // }
          if (value) {
            throw new Error(validationFailureMessage);
          } else if (!optional) {
            throw new Error(validationFailureMessage);
          }
        }
      }

      // 没有校验方法时，即输入什么，传什么

      // 判断零值是否需要传
      const { alwaysKeep, paramKey } = transformRule;
      if (alwaysKeep) {
        // 总是保留
        acc[paramKey] = value;
      } else {
        let shouldKeep = false;
        switch (MsrTypeOf(value)) {
          case MsrTypes.object:
            shouldKeep = Object.keys(value || {}).length > 0;
            break;
          case MsrTypes.array:
            shouldKeep = (value || []).length > 0;
            break;
          case MsrTypes.string:
          case MsrTypes.number:
            shouldKeep = !!value;
            break;
          default:
            break;
        }

        if (shouldKeep) {
          acc[paramKey] = value;
        }
      }

      return acc;
    }, {});

    return params;
  }
}

export function createParamObjectWithMetaInfo(metaInfo: TransformMetaInfoDict) {
  function createParamObject(payload: JSONLikeObject) {
    const paramObject = new ParamObject(metaInfo);
    paramObject.payload = payload;
    return paramObject;
  }

  return createParamObject;
}
