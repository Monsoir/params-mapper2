import { expect } from 'chai';
import { describe, it } from 'mocha';
import Validator from './Validator';

import { TransformMetaInfoDict, createParamObjectWithMetaInfo } from '../lib';
import { MsrTypeOf, MsrTypes } from '../lib/TypeOf';

describe('Check if createParamObjectWithMetaInfo return a function', () => {
  let metaInfo: TransformMetaInfoDict;
  beforeEach(() => {
    metaInfo = {
      a: {
        paramKey: 'aa',
      },
    };
  });
  it('Should return a function', () => {
    const createParamObject = createParamObjectWithMetaInfo(metaInfo);
    expect(createParamObject).to.be.a('function');
  });
});

describe('Keep values?', () => {
  let keepValueMetaInfo = null;
  let notKeepValueMetaInfo = null;
  let payload = null;
  beforeEach(() => {
    keepValueMetaInfo = {
      objectParam: {
        paramKey: 'object_param',
        alwaysKeep: true,
      },
      arrayParam: {
        paramKey: 'array_param',
        alwaysKeep: true,
      },
      stringParam: {
        paramKey: 'string_param',
        alwaysKeep: true,
      },
      numberParam: {
        paramKey: 'number_param',
        alwaysKeep: true,
      },
    };
    notKeepValueMetaInfo = {
      objectParam: {
        paramKey: 'object_param',
      },
      arrayParam: {
        paramKey: 'array_param',
      },
      stringParam: {
        paramKey: 'string_param',
      },
      numberParam: {
        paramKey: 'number_param',
      },
    };
    payload = {
      objectParam: {},
      arrayParam: [],
      stringParam: '',
      numberParam: 0,
    };
  });
  it('Always keep values', () => {
    const createParamObject = createParamObjectWithMetaInfo(keepValueMetaInfo);
    const paramObject = createParamObject(payload);
    const params = paramObject.getParams();
    expect(params.object_param).to.be.instanceOf(Object);
    expect(params.array_param).to.be.instanceOf(Array);
    expect(params.string_param).to.equals('');
    expect(params.number_param).to.equals(0);
  });

  it('Not keep empty values', () => {
    const createParamObject = createParamObjectWithMetaInfo(notKeepValueMetaInfo);
    const paramObject = createParamObject(payload);
    const params = paramObject.getParams();
    expect(params.object_param).to.be.undefined;
    expect(params.array_param).to.be.undefined;
    expect(params.string_param).to.be.undefined;
    expect(params.number_param).to.be.undefined;
  });
});

describe('validate', () => {
  let metaInfo = null;
  let emptyStringPayload = null;
  let emptyArrayPayload = null;
  beforeEach(() => {
    metaInfo = {
      emptyString: {
        paramKey: 'empty_string',
        validator: Validator.notEmptyString,
        validationFailureMessage: 'should not be empty(string)',
      },
      emptyArray: {
        paramKey: 'empty_array',
        validator: Validator.notEmptyArray,
        validationFailureMessage: 'should not be empty(array)',
      },
    };
    emptyStringPayload = {
      emptyString: '',
      emptyArray: [1, 2, 3],
    };
    emptyArrayPayload = {
      emptyString: 'abc',
      emptyArray: [],
    };
  });
  it('tip for empty string', () => {
    const createParamObject = createParamObjectWithMetaInfo(metaInfo);
    const paramObject = createParamObject(emptyStringPayload);
    try {
      const params = paramObject.getParams();  
    } catch (e) {
      expect(e.message).to.be.equals('should not be empty(string)');
    }
  });

  it('tip for empty array', () => {
    const createParamObject = createParamObjectWithMetaInfo(metaInfo);
    const paramObject = createParamObject(emptyArrayPayload);
    try {
      const params = paramObject.getParams();
    } catch (e) {
      expect(e.message).to.be.equals('should not be empty(array)');
    }
  });
});

describe('optional', () => {

  let optionalMetaInfo: TransformMetaInfoDict = null;
  let notOptionalMetaInfo: TransformMetaInfoDict = null;
  let hasValuePayload = null;
  let noValuePayload = null;
  beforeEach(() => {
    optionalMetaInfo = {
      name: {
        paramKey: 'username',
        validator: Validator.notEmptyString,
        validationFailureMessage: 'username should not be empty',
        optional: true,
      },
    };
    notOptionalMetaInfo = {
      name: {
        paramKey: 'username',
        validator: Validator.notEmptyString,
        validationFailureMessage: 'username should not be empty',
      },
    };
    hasValuePayload = {
      name: 'abc',
    };
    noValuePayload = {
      name: '',
    };
  });

  it('optional meta info with has-value payload -> params has value', () => {
    const createParamObject = createParamObjectWithMetaInfo(optionalMetaInfo);
    const paramObject = createParamObject(hasValuePayload);
    const params = paramObject.getParams();
    expect(params.username).equals('abc');
  });

  it('optional meta info with no-value payload -> params has no value', () => {
    const createParamObject = createParamObjectWithMetaInfo(optionalMetaInfo);
    const paramObject = createParamObject(noValuePayload);
    const params = paramObject.getParams();
    expect(params.username).is.undefined;
  });

  it('not optional meta info with has-value payload -> params has value', () => {
    const createParamObject = createParamObjectWithMetaInfo(notOptionalMetaInfo);
    const paramObject = createParamObject(hasValuePayload);
    const params = paramObject.getParams();
    expect(params.username).equals('abc');
  });

  it('not optional meta info with no-value payload -> exception thrown', () => {
    const createParamObject = createParamObjectWithMetaInfo(notOptionalMetaInfo);
    const paramObject = createParamObject(noValuePayload);

    try {
      const params = paramObject.getParams();
    } catch (e) {
      expect(e.message).equals('username should not be empty');
    }
  });
});

describe('optional param with validated and invalidated data', () => {
  let optionalMetaInfo: TransformMetaInfoDict = null;
  let falsyPayload = null;
  let truthyPayload = null;
  const shouldBeNumberValidator = $0 => MsrTypeOf($0) === MsrTypes.number;
  beforeEach(() => {
    optionalMetaInfo = {
      id: {
        paramKey: 'userid',
        validator: shouldBeNumberValidator,
        validationFailureMessage: 'id should be number',
      },
    };
    falsyPayload = {
      id: '1',
    };
    truthyPayload = {
      id: 1,
    };
  });

  it('optional param with invalidated data -> throw error', () => {
    const createParamObject = createParamObjectWithMetaInfo(optionalMetaInfo);
    const paramObject = createParamObject(falsyPayload);
    try {
      const params = paramObject.getParams();
    } catch (e) {
      expect(e.message).equals('id should be number');
    }
  });

  it('optional param with validated data -> params has value', () => {
    const createParamObject = createParamObjectWithMetaInfo(optionalMetaInfo);
    const paramObject = createParamObject(truthyPayload);
    const params = paramObject.getParams();
    expect(params.userid).equals(1);
  });
});

describe('reduce data', () => {
  let metaInfo: TransformMetaInfoDict = null;
  let payload = null;
  const reduceRuleExtractId = (acc, originValue) => {
    return acc.map(ele => ele.id);
  };
  const reduceRuleId2String = (acc, originValue) => {
    return acc.map(ele => `${ele}`);
  };
  beforeEach(() => {
    metaInfo = {
      ids: {
        paramKey: 'userids',
        reduceRule: {
          reducers: [
            reduceRuleExtractId,
            reduceRuleId2String,
          ],
        },
      }
    };
    payload = {
      ids: [
        {
          id: 1,
          name: 'a',
        },
        {
          id: 2,
          name: 'b',
        },
        {
          id: 3,
          name: 'c',
        },
      ],
    };
  });

  it('reduce object to ids of number, then ids of string', () => {
    const createParamObject = createParamObjectWithMetaInfo(metaInfo);
    const paramObject = createParamObject(payload);
    const params = paramObject.getParams();

    expect(params.userids).is.a('array');
    expect(params.userids).deep.equals(['1', '2', '3']);
  });
});

describe('can get params', () => {
  let metaInfo: TransformMetaInfoDict = null;
  let payload = null;
  beforeEach(() => {
    metaInfo = {
      emptyObject: {
        paramKey: 'empty_object',
        alwaysKeep: true,
      },
      emptyObjectNotKeep: {
        paramKey: 'empty_object_not_keep',
      },
      notEmptyObject: {
        paramKey: 'not_empty_object',
      },
    
      emptyArray: {
        paramKey: 'empty_array',
        alwaysKeep: true,
      },
      emptyArrayNotKeep: {
        paramKey: 'empty_array_not_keep',
      },
      notEmptyArray: {
        paramKey: 'not_empty_array',
      },
    
      emptyString: {
        paramKey: 'empty_string',
        alwaysKeep: true,
      },
      emptyStringNotKeep: {
        paramKey: 'empty_string_not_keep',
      },
      notEmptyString: {
        paramKey: 'not_empty_string',
      },
    
      nilNumber: {
        paramKey: 'nil_number',
        alwaysKeep: true,
      },
      nilNumberNotKeep: {
        paramKey: 'nil_number_not_keep',
      },
      notNilNumber: {
        paramKey: 'not_nil_number',
      },
    };
    payload = {
      emptyObject: {},
      emptyObjectNotKeep: {},
      notEmptyObject: { a: 1 },
  
      emptyArray: [],
      emptyArrayNotKeep: [],
      notEmptyArray: [1, 2, 3],
  
      emptyString: '',
      emptyStringNotKeep: '',
      notEmptyString: 'abc',
  
      nilNumber: 0,
      nilNumberNotKeep: 0,
      notNilNumber: 1000,
    };
  });

  it('get params', () => {
    const createParamObject = createParamObjectWithMetaInfo(metaInfo);
    const paramObject = createParamObject(payload);
    const params = paramObject.getParams();

    expect(params.empty_object).is.instanceOf(Object);
    expect(Object.keys(params.empty_object).length).equals(0);
    expect(params.empty_object_not_keep).is.undefined;
    expect(params.not_empty_object).is.not.undefined;
    expect(Object.keys(params.not_empty_object).length).is.above(0);

    expect(params.empty_array).is.instanceOf(Array);
    expect(params.empty_array.length).is.equals(0);
    expect(params.empty_array_not_keep).is.undefined;
    expect(params.not_empty_array).is.instanceOf(Array);
    expect(params.not_empty_array.length).is.above(0);

    expect(params.empty_string).is.equals('');
    expect(params.empty_string_not_keep).is.undefined;
    expect(params.not_empty_string).to.be.a('string');
    expect(params.not_empty_string.length).is.above(0);

    expect(params.nil_number).is.equals(0);
    expect(params.nil_number_not_keep).is.undefined;
    expect(params.not_nil_number).to.be.a('number');
    expect(params.not_nil_number).is.above(0);
  });
});
