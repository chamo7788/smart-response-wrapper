import { ResponseWrapper, ApiError, paginateArray, PaginationMeta } from './index';

describe('ApiError', () => {
  it('should create an error with the correct properties', () => {
    const errorDetails = { field: 'email', issue: 'invalid' };
    const error = new ApiError(400, 'Bad Request', errorDetails);
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Bad Request');
    expect(error.errors).toEqual(errorDetails);
  });

  it('should default errors to null when not provided', () => {
    const error = new ApiError(500, 'Internal Server Error');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Internal Server Error');
    expect(error.errors).toBeNull();
  });

  it('should have a stack trace', () => {
    const error = new ApiError(404, 'Not Found');

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('Not Found');
  });

  it('should work when Error.captureStackTrace is not available', () => {
    const original = Error.captureStackTrace;
    Error.captureStackTrace = undefined as any;

    try {
      const error = new ApiError(422, 'Unprocessable Entity', ['field error']);

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(422);
      expect(error.message).toBe('Unprocessable Entity');
      expect(error.errors).toEqual(['field error']);
    } finally {
      Error.captureStackTrace = original;
    }
  });

  it('should accept various error types: string, array, object', () => {
    const withString = new ApiError(400, 'Bad', 'string error');
    expect(withString.errors).toBe('string error');

    const withArray = new ApiError(400, 'Bad', ['err1', 'err2']);
    expect(withArray.errors).toEqual(['err1', 'err2']);

    const withNestedObj = new ApiError(400, 'Bad', { nested: { deep: true } });
    expect(withNestedObj.errors).toEqual({ nested: { deep: true } });
  });
});

describe('ResponseWrapper', () => {
  describe('Constructor', () => {
    it('should create a response with all parameters', () => {
      const meta: PaginationMeta = { page: 1, limit: 5 };
      const response = new ResponseWrapper(true, 200, 'OK', { id: 1 }, null, meta);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('OK');
      expect(response.data).toEqual({ id: 1 });
      expect(response.errors).toBeNull();
      expect(response.meta).toEqual(meta);
      expect(response.timestamp).toBeDefined();
    });

    it('should default data to null when not provided', () => {
      const response = new ResponseWrapper(false, 500, 'Error');

      expect(response.data).toBeNull();
      expect(response.errors).toBeNull();
      expect(response.meta).toBeUndefined();
    });

    it('should default errors to null when not provided', () => {
      const response = new ResponseWrapper(true, 200, 'OK', 'some data');

      expect(response.data).toBe('some data');
      expect(response.errors).toBeNull();
    });

    it('should not set meta when undefined is passed', () => {
      const response = new ResponseWrapper(true, 200, 'OK', null, null, undefined);

      expect(response.meta).toBeUndefined();
    });
  });

  describe('Success Method', () => {
    it('should return correct structure, status code, and timestamp for success', () => {
      const data = { id: 1, name: 'Test' };
      const response = ResponseWrapper.success(data, 201, 'Created successfully');

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('Created successfully');
      expect(response.data).toEqual(data);
      expect(response.errors).toBeNull();
      // timestamp should be a valid string in ISO format
      expect(typeof response.timestamp).toBe('string');
      expect(new Date(response.timestamp).getTime()).not.toBeNaN();
    });

    it('should assign default status code 200 and message if none are provided', () => {
      const data = { content: 'test' };
      const response = ResponseWrapper.success(data);

      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Success');
      expect(response.data).toEqual(data);
    });

    it('should accept and populate meta field if provided', () => {
      const data = ['item1', 'item2'];
      const meta: PaginationMeta = { page: 1, limit: 10, totalElements: 2, totalPages: 1 };
      const response = ResponseWrapper.success(data, 200, 'Success with meta', meta);

      expect(response.meta).toEqual(meta);
    });

    it('should not include meta when not provided', () => {
      const response = ResponseWrapper.success('data');

      expect(response.meta).toBeUndefined();
    });

    it('should handle various data types', () => {
      // string
      const strRes = ResponseWrapper.success('hello');
      expect(strRes.data).toBe('hello');

      // number
      const numRes = ResponseWrapper.success(42);
      expect(numRes.data).toBe(42);

      // array
      const arrRes = ResponseWrapper.success([1, 2, 3]);
      expect(arrRes.data).toEqual([1, 2, 3]);

      // boolean
      const boolRes = ResponseWrapper.success(true);
      expect(boolRes.data).toBe(true);

      // null-like
      const nullRes = ResponseWrapper.success(null);
      expect(nullRes.data).toBeNull();

      // nested object
      const nestedRes = ResponseWrapper.success({ a: { b: { c: 1 } } });
      expect(nestedRes.data).toEqual({ a: { b: { c: 1 } } });
    });

    it('should include meta with only required fields', () => {
      const meta: PaginationMeta = { page: 2, limit: 20 };
      const response = ResponseWrapper.success([], 200, 'OK', meta);

      expect(response.meta).toEqual({ page: 2, limit: 20 });
      expect(response.meta!.totalElements).toBeUndefined();
      expect(response.meta!.totalPages).toBeUndefined();
      expect(response.meta!.hasNextPage).toBeUndefined();
      expect(response.meta!.hasPrevPage).toBeUndefined();
    });
  });

  describe('Error Method', () => {
    it('should handle custom error messages and errors object correctly', () => {
      const errorDetails = { field: 'name', issue: 'is required' };
      const response = ResponseWrapper.error(400, 'Validation Failed', errorDetails);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(400);
      expect(response.message).toBe('Validation Failed');
      expect(response.data).toBeNull();
      expect(response.errors).toEqual(errorDetails);
    });

    it('should return default status code 500 and default message if none are provided', () => {
      const response = ResponseWrapper.error();

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(500);
      expect(response.message).toBe('An error occurred');
      expect(response.data).toBeNull();
      expect(response.errors).toBeNull();
    });

    it('should accept only a status code with defaults for other params', () => {
      const response = ResponseWrapper.error(404);

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('An error occurred');
      expect(response.errors).toBeNull();
    });

    it('should accept status code and message with default errors', () => {
      const response = ResponseWrapper.error(403, 'Forbidden');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(403);
      expect(response.message).toBe('Forbidden');
      expect(response.errors).toBeNull();
    });

    it('should handle array of errors', () => {
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too short' },
      ];
      const response = ResponseWrapper.error(422, 'Validation Error', errors);

      expect(response.errors).toEqual(errors);
      expect(response.errors).toHaveLength(2);
    });

    it('should not include meta in error responses', () => {
      const response = ResponseWrapper.error(500, 'Error');

      expect(response.meta).toBeUndefined();
    });

    it('should set data to null in error responses', () => {
      const response = ResponseWrapper.error(400, 'Bad Request');

      expect(response.data).toBeNull();
    });
  });
});

describe('paginateArray Helper', () => {
  const dummyItems = Array.from({ length: 25 }, (_, i) => i + 1);

  describe('Normal conditions with varying array sizes', () => {
    it('should correctly paginate and calculate metadata for the first page', () => {
      const result = paginateArray(dummyItems, 1, 10);

      expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalElements).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should correctly paginate and calculate metadata for a middle page', () => {
      const result = paginateArray(dummyItems, 2, 10);

      expect(result.data).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      expect(result.meta.page).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(true);
    });

    it('should correctly paginate and calculate metadata for the last page', () => {
      const result = paginateArray(dummyItems, 3, 10);

      expect(result.data).toEqual([21, 22, 23, 24, 25]);
      expect(result.meta.page).toBe(3);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(true);
    });
  });

  describe('Default parameters', () => {
    it('should use default page=1 and limit=10 when not provided', () => {
      const result = paginateArray(dummyItems);

      expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.totalElements).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should use default limit=10 when only page is provided', () => {
      const result = paginateArray(dummyItems, 2);

      expect(result.data).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty result and clamp limits for an empty array', () => {
      const result = paginateArray([], 1, 10);

      expect(result.data).toEqual([]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalElements).toBe(0);
      expect(result.meta.totalPages).toBe(0);
      expect(result.meta.hasNextPage).toBe(false); // 1 is not < 0
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should handle page number beyond available total pages gracefully', () => {
      const result = paginateArray(dummyItems, 5, 10);

      expect(result.data).toEqual([]);
      expect(result.meta.page).toBe(5);
      expect(result.meta.totalElements).toBe(25);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(true);
    });

    it('should clamp 0 or negative page and limit numbers to 1', () => {
      const result = paginateArray(dummyItems, 0, -5);

      expect(result.data).toEqual([1]);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(1);
      expect(result.meta.totalPages).toBe(25);
      expect(result.meta.hasNextPage).toBe(true);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should work correctly if data has null or undefined elements', () => {
      const arrayWithNulls = [null, undefined, 1, 2];
      const result = paginateArray(arrayWithNulls, 1, 3);

      expect(result.data).toEqual([null, undefined, 1]);
      expect(result.meta.totalElements).toBe(4);
      expect(result.meta.totalPages).toBe(2);
    });

    it('should handle a single-item array', () => {
      const result = paginateArray(['only'], 1, 10);

      expect(result.data).toEqual(['only']);
      expect(result.meta.totalElements).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should handle limit larger than total items', () => {
      const result = paginateArray([1, 2, 3], 1, 100);

      expect(result.data).toEqual([1, 2, 3]);
      expect(result.meta.totalElements).toBe(3);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should handle items exactly fitting one page', () => {
      const items = [1, 2, 3, 4, 5];
      const result = paginateArray(items, 1, 5);

      expect(result.data).toEqual([1, 2, 3, 4, 5]);
      expect(result.meta.totalPages).toBe(1);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(false);
    });

    it('should handle negative page number by clamping to 1', () => {
      const result = paginateArray(dummyItems, -3, 10);

      expect(result.meta.page).toBe(1);
      expect(result.data).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should paginate objects correctly', () => {
      const objects = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ];
      const result = paginateArray(objects, 1, 2);

      expect(result.data).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
      expect(result.meta.totalElements).toBe(3);
      expect(result.meta.totalPages).toBe(2);
      expect(result.meta.hasNextPage).toBe(true);
    });

    it('should return empty data for page 2 when limit equals total items', () => {
      const items = [1, 2, 3];
      const result = paginateArray(items, 2, 3);

      expect(result.data).toEqual([]);
      expect(result.meta.hasNextPage).toBe(false);
      expect(result.meta.hasPrevPage).toBe(true);
    });
  });
});
