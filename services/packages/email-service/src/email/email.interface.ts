/**
 * Interface for email messages processed by the email service
 */
export interface EmailMessage {
  /** Unique identifier for the notification */
  notification_id: string;
  /** Recipient email address */
  to: string;
  /** Template identifier for fetching template content */
  templateId: string;
  /** Variables to replace in the template (e.g., {{name}}) */
  variables: Record<string, any>;
  /** Current retry attempt count */
  attempt?: number;
  /** Unique request ID for idempotency */
  request_id?: string;
  /** User ID associated with the notification */
  user_id?: string;
  /** Priority level for processing */
  priority?: number;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Interface for email template structure
 */
export interface EmailTemplate {
  /** Template identifier */
  id: string;
  /** Email subject line */
  subject: string;
  /** HTML content of the email */
  content: string;
  /** Optional text version of the email */
  textContent?: string;
}

/**
 * Interface for email delivery status
 */
export interface EmailDeliveryStatus {
  /** Notification identifier */
  notification_id: string;
  /** Delivery status */
  status: 'delivered' | 'pending' | 'failed' | 'bounced';
  /** Timestamp of the status update */
  timestamp: string;
  /** Error message if delivery failed */
  error?: string;
  /** Delivery provider response */
  provider_response?: Record<string, any>;
}

/**
 * Interface for circuit breaker state
 */
export interface CircuitBreakerState {
  /** Current state of the circuit breaker */
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  /** Number of consecutive failures */
  failureCount: number;
  /** Timestamp when circuit breaker was opened */
  lastFailureTime?: number;
  /** Number of successful requests in half-open state */
  successCount?: number;
}