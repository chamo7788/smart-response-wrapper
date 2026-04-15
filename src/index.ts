export interface PaginationMeta {
  page: number;
  limit: number;
  totalElements?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export class ApiError extends Error {
  public statusCode: number;
  public errors: any | null;

  constructor(statusCode: number, message: string, errors: any | null = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ResponseWrapper<T> {
  public success: boolean;
  public statusCode: number;
  public message: string;
  public data: T | null;
  public errors: any | null;
  public meta?: PaginationMeta;
  public timestamp: string;

  constructor(
    success: boolean,
    statusCode: number,
    message: string,
    data: T | null = null,
    errors: any | null = null,
    meta?: PaginationMeta
  ) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.errors = errors;
    if (meta) {
      this.meta = meta;
    }
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, statusCode: number = 200, message: string = 'Success', meta?: PaginationMeta): ResponseWrapper<T> {
    return new ResponseWrapper<T>(true, statusCode, message, data, null, meta);
  }

  static error<T = null>(statusCode: number = 500, message: string = 'An error occurred', errors: any | null = null): ResponseWrapper<T> {
    return new ResponseWrapper<T>(false, statusCode, message, null, errors);
  }
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Helper function to paginate an array and generate pagination metadata.
 * 
 * @param items - The array of items to paginate
 * @param page - The current page number (1-indexed)
 * @param limit - The number of items per page
 * @returns An object containing the current page's data and pagination metadata
 */
export function paginateArray<T>(
  items: T[],
  page: number = 1,
  limit: number = 10
): PaginatedResult<T> {
  const pageNumber = Math.max(1, page);
  const limitNumber = Math.max(1, limit);
  const startIndex = (pageNumber - 1) * limitNumber;
  const endIndex = startIndex + limitNumber;

  const paginatedItems = items.slice(startIndex, endIndex);
  const totalElements = items.length;
  const totalPages = Math.ceil(totalElements / limitNumber);

  return {
    data: paginatedItems,
    meta: {
      page: pageNumber,
      limit: limitNumber,
      totalElements,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  };
}
