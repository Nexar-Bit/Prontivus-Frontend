/**
 * Messages API client
 */
import { api } from './api';

export interface MessageThread {
  id: number;
  patient_id: number;
  provider_id: number;
  provider_name: string;
  provider_specialty?: string;
  topic?: string;
  is_urgent: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at?: string;
  last_message_at?: string;
  last_message?: string;
  unread_count: number;
}

export interface Message {
  id: number;
  thread_id: number;
  sender_id: number;
  sender_type: 'patient' | 'provider' | 'system';
  content: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  read_at?: string;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  medical_context?: {
    type: string;
    reference_id?: string;
  };
}

export interface MessageThreadDetail extends MessageThread {
  messages: Message[];
}

export interface CreateThreadRequest {
  provider_id: number;
  topic?: string;
  is_urgent?: boolean;
}

export interface SendMessageRequest {
  content: string;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
    size: number;
  }>;
  medical_context?: {
    type: string;
    reference_id?: string;
  };
}

export const messagesApi = {
  /**
   * List all message threads for the current user
   */
  listThreads: async (archived: boolean = false): Promise<MessageThread[]> => {
    return api.get<MessageThread[]>(`/api/v1/messages/threads?archived=${archived}`);
  },

  /**
   * Get a specific thread with all messages
   */
  getThread: async (threadId: number): Promise<MessageThreadDetail> => {
    return api.get<MessageThreadDetail>(`/api/v1/messages/threads/${threadId}`);
  },

  /**
   * Create a new message thread
   */
  createThread: async (data: CreateThreadRequest): Promise<MessageThread> => {
    return api.post<MessageThread>('/api/v1/messages/threads', data);
  },

  /**
   * Send a message in a thread
   */
  sendMessage: async (threadId: number, data: SendMessageRequest): Promise<Message> => {
    return api.post<Message>(`/api/v1/messages/threads/${threadId}/send`, data);
  },

  /**
   * Delete (archive) a thread
   */
  deleteThread: async (threadId: number): Promise<void> => {
    return api.delete(`/api/v1/messages/threads/${threadId}`);
  },
};

