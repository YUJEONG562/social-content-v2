import { users, type User, type InsertUser, contentRequests, type ContentRequest, type InsertContentRequest } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Content request methods
  createContentRequest(request: InsertContentRequest & { sessionId?: string }): Promise<ContentRequest>;
  getContentRequest(id: number): Promise<ContentRequest | undefined>;
  updateContentRequest(id: number, content: string): Promise<ContentRequest | undefined>;
  
  // Daily usage tracking
  getDailyUsageCount(sessionId: string): Promise<number>;
  
  // Share functionality
  createShareableContent(id: number): Promise<string>; // returns shareId
  getSharedContent(shareId: string): Promise<ContentRequest | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private contentRequests: Map<number, ContentRequest>;
  private currentUserId: number;
  private currentContentId: number;

  constructor() {
    this.users = new Map();
    this.contentRequests = new Map();
    this.currentUserId = 1;
    this.currentContentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createContentRequest(insertRequest: InsertContentRequest & { sessionId?: string }): Promise<ContentRequest> {
    const id = this.currentContentId++;
    const request: ContentRequest = {
      ...insertRequest,
      id,
      generatedContent: null,
      sessionId: insertRequest.sessionId || null,
      shareId: null,
      isPublic: false,
      createdAt: new Date(),
    };
    this.contentRequests.set(id, request);
    return request;
  }

  async getContentRequest(id: number): Promise<ContentRequest | undefined> {
    return this.contentRequests.get(id);
  }

  async updateContentRequest(id: number, content: string): Promise<ContentRequest | undefined> {
    const request = this.contentRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, generatedContent: content };
    this.contentRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async getDailyUsageCount(sessionId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let count = 0;
    const requests = Array.from(this.contentRequests.values());
    for (const request of requests) {
      if (request.sessionId === sessionId && 
          request.createdAt && 
          request.createdAt >= today && 
          request.createdAt < tomorrow) {
        count++;
      }
    }
    return count;
  }

  async createShareableContent(id: number): Promise<string> {
    const request = this.contentRequests.get(id);
    if (!request || !request.generatedContent) {
      throw new Error("Content not found or not generated");
    }

    const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const updatedRequest = { 
      ...request, 
      shareId, 
      isPublic: true 
    };
    this.contentRequests.set(id, updatedRequest);
    return shareId;
  }

  async getSharedContent(shareId: string): Promise<ContentRequest | undefined> {
    return Array.from(this.contentRequests.values()).find(
      request => request.shareId === shareId && request.isPublic
    );
  }
}

export const storage = new MemStorage();
