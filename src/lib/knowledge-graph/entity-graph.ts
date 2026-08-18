// Entity Knowledge Graph
// In-memory graph with persistence to PostgreSQL

import {
  EntityNode,
  EntityEdge,
  EnrichedEntity,
  RelationType,
  ResolvedValue,
  FieldSource,
  SemanticFieldType,
  ResolveContext,
} from "./types";
import { db } from "@/lib/db";

class EntityKnowledgeGraph {
  // In-memory cache for fast lookups
  private nodes: Map<string, EntityNode> = new Map();
  private edges: Map<string, EntityEdge[]> = new Map(); // nodeId -> edges
  
  // Cache statistics
  private lastUpdated: Date = new Date();
  private cacheSize: number = 0;

  constructor() {
    this.initializeGraph();
  }

  /**
   * Initialize the knowledge graph with seed data
   */
  private async initializeGraph(): Promise<void> {
    // Load from database if available
    try {
      const relations = await db.entityRelation.findMany({
        take: 1000, // Limit initial load
        orderBy: { createdAt: "desc" },
      });

      // Build in-memory graph from stored relations
      for (const rel of relations) {
        this.addEdgeToMemory(rel);
      }

      this.lastUpdated = new Date();
      this.cacheSize = this.nodes.size;
      console.log(`Knowledge graph initialized with ${this.nodes.size} nodes`);
    } catch (error) {
      console.error("Error initializing knowledge graph:", error);
    }
  }

  /**
   * Add edge to in-memory graph
   */
  private addEdgeToMemory(relation: any): void {
    // Create or update from node
    if (!this.nodes.has(relation.fromEntityId)) {
      this.nodes.set(relation.fromEntityId, {
        id: relation.fromEntityId,
        type: relation.entityType as any,
        label: relation.fromEntityId,
        properties: {},
        lastUpdated: new Date(),
      });
    }

    // Create or update to node
    if (!this.nodes.has(relation.toEntityId)) {
      this.nodes.set(relation.toEntityId, {
        id: relation.toEntityId,
        type: "company", // Default type
        label: relation.toEntityId,
        properties: {},
        lastUpdated: new Date(),
      });
    }

    // Add edge
    const edge: EntityEdge = {
      id: relation.id,
      fromEntityId: relation.fromEntityId,
      toEntityId: relation.toEntityId,
      relationType: relation.relationType as RelationType,
      weight: relation.weight,
      since: relation.since || undefined,
      metadata: relation.metadata as Record<string, any> | undefined,
    };

    const existingEdges = this.edges.get(relation.fromEntityId) || [];
    existingEdges.push(edge);
    this.edges.set(relation.fromEntityId, existingEdges);
  }

  /**
   * Resolve a field value using the knowledge graph and context
   */
  async resolveField(
    semanticType: SemanticFieldType,
    context: ResolveContext
  ): Promise<ResolvedValue> {
    
    // Try different resolution strategies based on field type
    
    switch (semanticType) {
      case "company_legal_name":
        return await this.resolveCompanyName(context);
      
      case "registration_number":
        return await this.resolveRegistrationNumber(context);
      
      case "registered_address":
        return await this.resolveAddress(context);
      
      case "sector":
        return await this.resolveSector(context);
      
      case "employee_count":
        return await this.resolveEmployeeCount(context);
      
      case "annual_revenue":
        return await this.resolveRevenue(context);
      
      case "project_abstract":
      case "impact_statement":
      case "risk_assessment":
      case "innovation_description":
        // These require LLM generation - return context data
        return await this.resolveFromContext(semanticType, context);
      
      default:
        return await this.resolveFromContext(semanticType, context);
    }
  }

  /**
   * Resolve company name
   */
  private async resolveCompanyName(context: ResolveContext): Promise<ResolvedValue> {
    // Check user profile first
    if (context.existingData?.companyName) {
      return {
        value: context.existingData.companyName,
        confidence: 0.95,
        source: "user_profile",
        sourceDetails: "From user profile",
        requiresReview: false,
      };
    }

    // Check company data if companyId provided
    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.name) {
          return {
            value: company.name,
            confidence: 1.0,
            source: "company_data",
            sourceDetails: `From Companies House (${company.registrationNumber})`,
            requiresReview: false,
          };
        }
      } catch (error) {
        console.error("Error fetching company:", error);
      }
    }

    return this.unresolvedValue("Company name not found");
  }

  /**
   * Resolve registration number
   */
  private async resolveRegistrationNumber(context: ResolveContext): Promise<ResolvedValue> {
    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.registrationNumber) {
          return {
            value: company.registrationNumber,
            confidence: 1.0,
            source: "company_data",
            sourceDetails: "Companies House registration number",
            requiresReview: false,
          };
        }
      } catch (error) {
        console.error("Error fetching registration:", error);
      }
    }

    return this.unresolvedValue("Registration number not found");
  }

  /**
   * Resolve address
   */
  private async resolveAddress(context: ResolveContext): Promise<ResolvedValue> {
    if (context.existingData?.address) {
      return {
        value: context.existingData.address,
        confidence: 0.9,
        source: "user_profile",
        sourceDetails: "From user profile",
        requiresReview: true,
        reviewReasons: ["Please verify address is complete and current"],
      };
    }

    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.registeredAddress) {
          return {
            value: company.registeredAddress,
            confidence: 1.0,
            source: "company_data",
            sourceDetails: "Registered address from Companies House",
            requiresReview: false,
          };
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    }

    return this.unresolvedValue("Address not found");
  }

  /**
   * Resolve sector
   */
  private async resolveSector(context: ResolveContext): Promise<ResolvedValue> {
    if (context.existingData?.sector) {
      return {
        value: context.existingData.sector,
        confidence: 0.9,
        source: "user_profile",
        sourceDetails: "From user profile",
        requiresReview: false,
      };
    }

    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.sector) {
          return {
            value: company.sector,
            confidence: 1.0,
            source: "company_data",
            sourceDetails: "Primary sector from company record",
            requiresReview: false,
          };
        }
      } catch (error) {
        console.error("Error fetching sector:", error);
      }
    }

    return this.unresolvedValue("Sector not found");
  }

  /**
   * Resolve employee count
   */
  private async resolveEmployeeCount(context: ResolveContext): Promise<ResolvedValue> {
    if (context.existingData?.employeeCount) {
      return {
        value: String(context.existingData.employeeCount),
        confidence: 0.95,
        source: "user_profile",
        sourceDetails: "From user profile",
        requiresReview: false,
      };
    }

    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.employeeCount) {
          return {
            value: String(company.employeeCount),
            confidence: 1.0,
            source: "company_data",
            sourceDetails: "Employee count from company record",
            requiresReview: false,
          };
        }
      } catch (error) {
        console.error("Error fetching employee count:", error);
      }
    }

    return this.unresolvedValue("Employee count not found");
  }

  /**
   * Resolve revenue
   */
  private async resolveRevenue(context: ResolveContext): Promise<ResolvedValue> {
    if (context.existingData?.revenue) {
      return {
        value: String(context.existingData.revenue),
        confidence: 0.85,
        source: "user_profile",
        sourceDetails: "From user profile - may need updating",
        requiresReview: true,
        reviewReasons: ["Financial data should be verified against latest accounts"],
      };
    }

    if (context.companyId) {
      try {
        const company = await db.company.findUnique({
          where: { id: context.companyId },
        });
        
        if (company?.annualRevenue) {
          return {
            value: String(company.annualRevenue),
            confidence: 0.9,
            source: "company_data",
            sourceDetails: "Annual revenue from company record",
            requiresReview: true,
            reviewReasons: ["Verify this matches your latest filed accounts"],
          };
        }
      } catch (error) {
        console.error("Error fetching revenue:", error);
      }
    }

    return this.unresolvedValue("Revenue information not found");
  }

  /**
   * Resolve field from context data (for LLM-generated fields)
   */
  private async resolveFromContext(
    semanticType: SemanticFieldType,
    context: ResolveContext
  ): Promise<ResolvedValue> {
    // Map semantic types to context keys
    const contextKeyMap: Partial<Record<SemanticFieldType, string>> = {
      project_title: "projectTitle",
      project_abstract: "abstract",
      impact_statement: "impactStatement",
      risk_assessment: "riskAssessment",
      innovation_description: "innovationDescription",
    };

    const key = contextKeyMap[semanticType];
    if (key && context.existingData?.[key]) {
      return {
        value: context.existingData[key],
        confidence: 0.7,
        source: "previous_application",
        sourceDetails: "From previous application data",
        requiresReview: true,
        reviewReasons: ["Content may need updating for this application"],
      };
    }

    return this.unresolvedValue(`${semanticType} requires content generation`);
  }

  /**
   * Enrich an entity with computed fields and relationships
   */
  async enrichEntity(entityId: string): Promise<EnrichedEntity | null> {
    const node = this.nodes.get(entityId);
    
    if (!node) {
      // Try to load from database
      try {
        const company = await db.company.findUnique({
          where: { id: entityId },
          include: { fundingRounds: true },
        });
        
        if (company) {
          return this.createEnrichedCompany(company);
        }
      } catch (error) {
        console.error("Error enriching entity:", error);
      }
      
      return null;
    }

    // Get all edges connected to this node
    const outgoingEdges = this.edges.get(entityId) || [];
    const incomingEdges = this.findIncomingEdges(entityId);
    
    const allEdges = [...outgoingEdges, ...incomingEdges];
    
    // Get related entity IDs
    const relatedIds = allEdges.map(e => 
      e.fromEntityId === entityId ? e.toEntityId : e.fromEntityId
    );
    
    const relatedEntities = relatedIds.map(id => this.nodes.get(id)).filter(Boolean) as EntityNode[];

    // Compute derived metrics
    const fundingRounds = allEdges.filter(e => 
      e.relationType === "funded_by" || e.relationType === "received_grant"
    );
    
    const totalFunding = fundingRounds.reduce((sum, e) => 
      sum + (e.metadata?.amount || 0), 0
    );

    return {
      ...node,
      edges: allEdges,
      relatedEntities,
      computedFields: {
        fundingTotal: totalFunding,
        grantSuccessRate: this.calculateGrantSuccessRate(allEdges),
        partnershipCount: allEdges.filter(e => e.relationType === "partnered_with").length,
        patentCount: allEdges.filter(e => e.relationType === "has_patent").length,
        publicationCount: allEdges.filter(e => e.relationType === "has_publication").length,
        sectorRelevance: this.calculateSectorRelevance(node),
      },
    };
  }

  /**
   * Find edges pointing to a node
   */
  private findIncomingEdges(entityId: string): EntityEdge[] {
    const incoming: EntityEdge[] = [];
    
    for (const [, edges] of this.edges.entries()) {
      for (const edge of edges) {
        if (edge.toEntityId === entityId) {
          incoming.push(edge);
        }
      }
    }
    
    return incoming;
  }

  /**
   * Calculate grant success rate from edges
   */
  private calculateGrantSuccessRate(edges: EntityEdge[]): number {
    const grantEdges = edges.filter(e => e.relationType === "received_grant");
    if (grantEdges.length === 0) return 0;
    
    // Assume success based on grant presence (simplified)
    return Math.min(grantEdges.length / 5, 1); // Normalize to 0-1
  }

  /**
   * Calculate sector relevance score
   */
  private calculateSectorRelevance(_node: EntityNode): number {
    // Simplified - would use more sophisticated analysis
    return 0.75;
  }

  /**
   * Create enriched entity from company data
   */
  private createEnrichedCompany(company: any): EnrichedEntity {
    const totalFunding = company.fundingRounds?.reduce(
      (sum: number, r: any) => sum + (r.raisedAmount || 0), 
      0
    ) || 0;

    return {
      id: company.id,
      type: "company",
      label: company.name,
      properties: {
        name: company.name,
        registrationNumber: company.registrationNumber,
        sector: company.sector,
        employeeCount: company.employeeCount,
        annualRevenue: company.annualRevenue,
      },
      lastUpdated: company.lastSyncedAt || new Date(),
      edges: [],
      relatedEntities: [],
      computedFields: {
        fundingTotal: totalFunding,
        grantSuccessRate: company.fundingRounds?.filter((r: any) => r.roundType === "grant").length > 0 ? 0.8 : 0.3,
        partnershipCount: 0,
        patentCount: 0,
        publicationCount: 0,
        sectorRelevance: 0.8,
      },
    };
  }

  /**
   * Find similar companies based on sector, size, location
   */
  async findSimilarCompanies(companyId: string, limit: number = 10): Promise<any[]> {
    try {
      const company = await db.company.findUnique({
        where: { id: companyId },
      });

      if (!company) return [];

      // Find companies in same sector
      const similar = await db.company.findMany({
        where: {
          id: { not: companyId },
          sector: company.sector,
        },
        take: limit,
        include: { fundingRounds: { take: 5 } },
      });

      return similar;
    } catch (error) {
      console.error("Error finding similar companies:", error);
      return [];
    }
  }

  /**
   * Get funding history for an entity
   */
  async getFundingHistory(entityId: string): Promise<Array<{
    roundType: string;
    amount: number;
    date: Date | null;
    source: string;
  }>> {
    try {
      const company = await db.company.findUnique({
        where: { id: entityId },
        include: {
          fundingRounds: {
            orderBy: { announcedDate: "desc" },
            take: 20,
          },
        },
      });

      if (!company) return [];

      return company.fundingRounds.map(round => ({
        roundType: round.roundType || "unknown",
        amount: round.raisedAmount || 0,
        date: round.announcedDate,
        source: round.source || "unknown",
      }));
    } catch (error) {
      console.error("Error getting funding history:", error);
      return [];
    }
  }

  /**
   * Add a relationship to the graph
   */
  async addRelationship(
    fromEntityId: string,
    toEntityId: string,
    relationType: RelationType,
    weight: number = 1.0,
    metadata?: Record<string, any>
  ): Promise<EntityEdge> {
    try {
      const relation = await db.entityRelation.create({
        data: {
          fromEntityId,
          toEntityId,
          entityType: "company",
          relationType,
          weight,
          metadata: metadata as any,
        },
      });

      // Update in-memory cache
      this.addEdgeToMemory(relation);

      return {
        id: relation.id,
        fromEntityId: relation.fromEntityId,
        toEntityId: relation.toEntityId,
        relationType: relation.relationType as RelationType,
        weight: relation.weight,
        since: relation.since || undefined,
        metadata: relation.metadata as Record<string, any> | undefined,
      };
    } catch (error) {
      console.error("Error adding relationship:", error);
      throw error;
    }
  }

  /**
   * Return unresolved value placeholder
   */
  private unresolvedValue(reason: string): ResolvedValue {
    return {
      value: "",
      confidence: 0,
      source: "not_resolved",
      sourceDetails: reason,
      requiresReview: true,
      reviewReasons: [reason],
    };
  }

  /**
   * Get graph statistics
   */
  getStats(): {
    nodeCount: number;
    edgeCount: number;
    lastUpdated: Date;
  } {
    let edgeCount = 0;
    for (const [, edges] of this.edges.entries()) {
      edgeCount += edges.length;
    }

    return {
      nodeCount: this.nodes.size,
      edgeCount,
      lastUpdated: this.lastUpdated,
    };
  }
}

// Singleton instance
export const entityKnowledgeGraph = new EntityKnowledgeGraph();
