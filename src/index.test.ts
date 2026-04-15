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
});

describe('ResponseWrapper', () => {
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
  });
});
