import { NextResponse } from 'next/server';

/**
 * Enhanced error messages and error handling utilities
 * Provides user-friendly error messages with proper logging
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  API_ERROR = 'API_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TIMEOUT = 'TIMEOUT',
}

interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  details?: any;
}

const ERROR_MESSAGES: Record<ErrorType, { message: string; userMessage: string; statusCode: number; retryable: boolean }> = {
  [ErrorType.VALIDATION]: {
    message: 'Request validation failed',
    userMessage: 'Please check your input and try again.',
    statusCode: 400,
    retryable: false,
  },
  [ErrorType.NOT_FOUND]: {
    message: 'Resource not found',
    userMessage: 'The app or resource you\'re looking for was not found. Please try with a different app name.',
    statusCode: 404,
    retryable: false,
  },
  [ErrorType.RATE_LIMIT]: {
    message: 'Rate limit exceeded',
    userMessage: 'You\'ve made too many requests. Please wait a moment and try again.',
    statusCode: 429,
    retryable: true,
  },
  [ErrorType.API_ERROR]: {
    message: 'External API error',
    userMessage: 'The app store is temporarily unavailable. Please try again in a moment.',
    statusCode: 503,
    retryable: true,
  },
  [ErrorType.NETWORK_ERROR]: {
    message: 'Network error occurred',
    userMessage: 'Check your internet connection and try again.',
    statusCode: 0,
    retryable: true,
  },
  [ErrorType.INTERNAL_ERROR]: {
    message: 'Internal server error',
    userMessage: 'Something went wrong on our end. Our team has been notified. Please try again later.',
    statusCode: 500,
    retryable: true,
  },
  [ErrorType.UNAUTHORIZED]: {
    message: 'Unauthorized access',
    userMessage: 'You need to be logged in to perform this action.',
    statusCode: 401,
    retryable: false,
  },
  [ErrorType.FORBIDDEN]: {
    message: 'Access forbidden',
    userMessage: 'You don\'t have permission to perform this action.',
    statusCode: 403,
    retryable: false,
  },
  [ErrorType.TIMEOUT]: {
    message: 'Request timeout',
    userMessage: 'The request took too long. Please try again.',
    statusCode: 408,
    retryable: true,
  },
};

export class AppError extends Error {
  type: ErrorType;
  userMessage: string;
  statusCode: number;
  retryable: boolean;
  details?: any;

  constructor(type: ErrorType, details?: any) {
    const errorConfig = ERROR_MESSAGES[type];
    super(errorConfig.message);
    
    this.type = type;
    this.userMessage = errorConfig.userMessage;
    this.statusCode = errorConfig.statusCode;
    this.retryable = errorConfig.retryable;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorDetails {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      statusCode: this.statusCode,
      retryable: this.retryable,
      details: this.details,
    };
  }
}

/**
 * Create standardized error response
 */
export function createErrorResponse(error: unknown, fallbackType: ErrorType = ErrorType.INTERNAL_ERROR) {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      appError = new AppError(ErrorType.NETWORK_ERROR, { originalMessage: error.message });
    } else if (message.includes('timeout')) {
      appError = new AppError(ErrorType.TIMEOUT, { originalMessage: error.message });
    } else {
      appError = new AppError(fallbackType, { originalError: String(error) });
    }
  } else {
    appError = new AppError(fallbackType, { originalError: String(error) });
  }

  const errorDetails = appError.toJSON();
  
  return NextResponse.json(
    { error: errorDetails },
    { status: errorDetails.statusCode || 500 }
  );
}

/**
 * Log error with context
 */
export function logError(error: unknown, context: Record<string, any> = {}) {
  const timestamp = new Date().toISOString();
  const errorData = error instanceof AppError ? error.toJSON() : { error: String(error) };
  
  console.error(`[${timestamp}] Error:`, {
    ...errorData,
    context,
  });
}
