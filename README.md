# params-mapper

将前端页面参数映射到返回给服务端的参数

老 [params-mapper](https://github.com/Monsoir/params-mapper) 的重构版本，使用返回函数的函数的方式，提供更好的 Intellisense 支持

## 安装

```sh
npm i @monsoir/params-mapper
```

## 特性

```ts
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
```

## 使用方法

### 定义转换规则

```js
// ParamObject.js

import { createParamObjectWithMetaInfo } from '@monsoir/params-mapper';
import Validator from '$utils/Validator';

// 1
const getFromValue = $0 => $0.value;
const extraId = $0 => ($0 || []).map(ele => ele.id);

// 2
const TransformMetaInfo = {
  type: {
    paramKey: 'userFounder',
    validator: Validator.notEmptyString,
    validationFailureMessage: '请选择类型',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  account: {
    paramKey: 'account',
    validator: Validator.notEmptyString,
    validationFailureMessage: '用户工号不能为空',
    alwaysKeep: true,
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  name: {
    paramKey: 'name',
    validator: Validator.notEmptyString,
    validationFailureMessage: '用户名称不能为空',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  organization: {
    paramKey: 'organization',
    validator: Validator.notEmptyString,
    validationFailureMessage: '组织部门不能为空',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  status: {
    paramKey: 'status',
    validator: Validator.notEmptyString,
    validationFailureMessage: '请选择状态',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  telephone: {
    paramKey: 'telephone',
    validator: Validator.isTelephone,
    validationFailureMessage: '请填写正确的手机号码',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  email: {
    paramKey: 'email',
    validator: Validator.isEmail,
    validationFailureMessage: '请填写正确的邮箱',
    optional: true,
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  remark: {
    paramKey: 'remark',
    reduceRule: {
      reducers: [
        getFromValue,
      ],
    },
  },
  chosenRoles: {
    paramKey: 'chosenRole',
    reduceRule: {
      reducers: [
        extraId,
      ],
    },
  },
};

// 3
const createParamObject = createParamObjectWithMetaInfo(TransformMetaInfo);
export default createParamObject;
```

1. 定义了如何将页面的原始数据转换为请求中需要的数据的方法
2. 定义一个规则对象，该对象的功能有但不限于
     - 转换后，对象请求参数字段中的对应的 key
     - 验证方式
     - 验证失败提示信息
     - 配置原始数据转换的方法
3. 使用步骤2中的规则对象，通过 `createParamObjectWithMetaInfo` 创建一个函数 `createParamObject`, 此函数中已包含了转换规则对象，随后将通过 `createParamObject` 此函数获取请求参数对象

### 页面构建请求参数对象处

```js
// AReactComponent.jsx

// 此处的 key 为 React 组件中 state 的 key, 具体值存放与对应值中的 `value` 字段
const stateKeys = [
  'type',
  'account',
  'name',
  'organization',
  'status',
  'telephone',
  'email',
  'remark',
];


// 1
const payload = stateKeys.reduce((acc, currentValue) => {
  acc[currentValue] = this.state.infoFields[currentValue];
  return acc;
}, {});

payload.chosenRoles = this.state.chosenRoles; // 数组类型

// 2
const paramObject = createParamObject(payload);
let params = null;

// 3
try {
  params = paramObject.getParams();
} catch (e) {
  message.error(e.message);
  return;
}

// 4
console.log(params);
```

1. 创建前端页面字段 key 与值的映射对象 `payload`
2. 通过 `createParamObject` 方法生成参数转换对象 `paramObject`
3. 使用 `try...catch` 包裹生成请求参数的流程 `paramObject.getParams()`, 验证失败时，将通过抛出异常进行通知
    - 同时中止正在进行的验证与转换工作，因为请求对象已经不符合要求，就没必要继续往下继续执行了
4. 最后得到 params 对象，直接放到请求中

最后得到的数据

```json
{
  "userFounder": "0",
  "account": "123",
  "name": "13",
  "organization": "xxxxxxx",
  "status": "1",
  "telephone": "xxxxxxxxxxx",
  "email": "test@test.com",
  "remark": "123",
  "chosenRole": [
    "1075217925478047746",
    "1075217809077723137",
    "1075217733278261250"
  ]
}
```


