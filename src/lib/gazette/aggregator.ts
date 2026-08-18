// Gazette Aggregator Service
// Combines all gazette sources into a unified feed

import { londonGazetteParser, LondonGazetteNotice, GazetteNoticeType as LGNoticeType } from "./london-gazette";
import { ojeuParser, OJEUNotice } from "./ojeu-parser";
import { federalRegisterParser, FederalRegisterNotice } from "./federal-register";

export interface UnifiedGazetteNotice {
  id: string;
  source: "london_gazette" | "ojeu_ted" | "federal_register";
  sourceLabel: string;
  noticeType: NoticeType;
  title: string;
  content?: string;
  publishedAt: Date;
  url: string;
  priority: "low" | "medium" | "high" | "urgent";
  metadata: Record<string, any>;
}

export type NoticeType = 
  | "insolvency"
  | "grant"
  | "procurement"
  | "regulation"
  | "court_notice"
  | "honor"
  | "company_update"
  | "other";

class GazetteAggregatorService {
  
  /**
   * Fetch and aggregate notices from all sources
   */
  async fetchAllNotices(options?: {
    limit?: number;
    sources?: Array<"london_gazette" | "ojeu_ted" | "federal_register">;
    types?: NoticeType[];
  }): Promise<UnifiedGazetteNotice[]> {
    const limit = options?.limit || 100;
    const sources = options?.sources || ["london_gazette", "ojeu_ted", "federal_register"];
    
    const promises: Promise<UnifiedGazetteNotice[]>[] = [];

    if (sources.includes("london_gazette")) {
      promises.push(this.fetchLondonGazetteNotices(limit));
    }
    if (sources.includes("ojeu_ted")) {
      promises.push(this.fetchOJEUNotices(limit));
    }
    if (sources.includes("federal_register")) {
      promises.push(this.fetchFederalRegisterNotices(limit));
    }

    const results = await Promise.allSettled(promises);
    
    let allNotices: UnifiedGazetteNotice[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        allNotices = [...allNotices, ...result.value];
      }
    }

    // Sort by date (newest first)
    allNotices.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());

    // Filter by types if specified
    if (options?.types && options.types.length > 0) {
      allNotices = allNotices.filter(n => options.types!.includes(n.noticeType));
    }

    return allNotices.slice(0, limit);
  }

  private async fetchLondonGazetteNotices(limit: number): Promise<UnifiedGazetteNotice[]> {
    try {
      const notices = await londonGazetteParser.fetchLatestNotices(limit);
      return notices.map(notice => this.transformLondonGazetteNotice(notice));
    } catch (error) {
      console.error("Error fetching London Gazette:", error);
      return [];
    }
  }

  private transformLondonGazetteNotice(notice: LondonGazetteNotice): UnifiedGazetteNotice {
    return {
      id: notice.id,
      source: "london_gazette",
      sourceLabel: "London Gazette",
      noticeType: this.mapLGNoticeType(notice.noticeType),
      title: notice.title,
      content: notice.content,
      publishedAt: new Date(notice.publishedAt),
      url: notice.url,
      priority: this.calculatePriority(notice.noticeType),
      metadata: notice.metadata,
    };
  }

  private mapLGNoticeType(type: LGNoticeType): NoticeType {
    return type as NoticeType;
  }

  private async fetchOJEUNotices(limit: number): Promise<UnifiedGazetteNotice[]> {
    try {
      const notices = await ojeuParser.fetchLatestNotices(limit);
      return notices.map(notice => ({
        id: notice.id,
        source: "ojeu_ted",
        sourceLabel: "EU OJEU/TED",
        noticeType: notice.noticeType as NoticeType,
        title: notice.title,
        content: notice.content,
        publishedAt: new Date(notice.publishedAt),
        url: notice.url,
        priority: this.calculatePriority(notice.noticeType as NoticeType),
        metadata: notice.metadata,
      }));
    } catch (error) {
      console.error("Error fetching OJEU/TED:", error);
      return [];
    }
  }

  private async fetchFederalRegisterNotices(limit: number): Promise<UnifiedGazetteNotice[]> {
    try {
      const notices = await federalRegisterParser.fetchLatestNotices(limit);
      return notices.map(notice => ({
        id: notice.id,
        source: "federal_register",
        sourceLabel: "US Federal Register",
        noticeType: notice.noticeType as NoticeType,
        title: notice.title,
        content: notice.content,
        publishedAt: new Date(notice.publishedAt),
        url: notice.url,
        priority: this.calculatePriority(notice.noticeType as NoticeType),
        metadata: notice.metadata,
      }));
    } catch (error) {
      console.error("Error fetching Federal Register:", error);
      return [];
    }
  }

  private calculatePriority(type: NoticeType): "low" | "medium" | "high" | "urgent" {
    switch (type) {
      case "insolvency":
        return "high";
      case "grant":
        return "high";
      case "procurement":
        return "medium";
      case "regulation":
        return "medium";
      case "court_notice":
        return "high";
      default:
        return "low";
    }
  }

  /**
   * Get summary statistics for dashboard
   */
  async getSummaryStats(): Promise<{
    totalToday: number;
    bySource: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const notices = await this.fetchAllNotices({ limit: 200 });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayNotices = notices.filter(n => n.publishedAt >= today);

    return {
      totalToday: todayNotices.length,
      bySource: this.countBy(notices, "source"),
      byType: this.countBy(notices, "noticeType"),
    };
  }

  private countBy(arr: UnifiedGazetteNotice[], field: keyof UnifiedGazetteNotice): Record<string, number> {
    return arr.reduce((acc, item) => {
      const key = String(item[field] || "unknown");
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Singleton instance
export const gazetteAggregator = new GazetteAggregatorService();
