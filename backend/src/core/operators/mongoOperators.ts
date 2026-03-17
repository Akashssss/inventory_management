/**
 * MONGO OPERATOR REGISTRY
 * Maps filter operators to MongoDB query handlers
 * Extensible design: add new operators by calling registry.register()
 */

import { FilterOperator,  IOperatorRegistry,
  MongoFilterQuery,
  OperatorHandler,
  RegisteredOperator, } from "../../types/query.types";


/**
 * Default MongoDB operators
 * Each handler returns a MongoDB filter query fragment
 */
const defaultOperators: Record<FilterOperator, OperatorHandler> = {
  // ==================== COMPARISON ====================
  eq: (field: string, value: any) => ({
    [field]: value,
  }),

  ne: (field: string, value: any) => ({
    [field]: { $ne: value },
  }),

  lt: (field: string, value: any) => ({
    [field]: { $lt: value },
  }),

  lte: (field: string, value: any) => ({
    [field]: { $lte: value },
  }),

  gt: (field: string, value: any) => ({
    [field]: { $gt: value },
  }),

  gte: (field: string, value: any) => ({
    [field]: { $gte: value },
  }),

  // ==================== RANGE ====================
  between: (field: string, value: any) => {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error(
        `"between" operator requires an array with 2 values [min, max]`
      );
    }
    const [min, max] = value;
    return {
      [field]: { $gte: min, $lte: max },
    };
  },

  // ==================== ARRAY/SET ====================
  in: (field: string, value: any) => {
    if (!Array.isArray(value)) {
      throw new Error(`"in" operator requires an array value`);
    }
    return {
      [field]: { $in: value },
    };
  },

  notIn: (field: string, value: any) => {
    if (!Array.isArray(value)) {
      throw new Error(`"notIn" operator requires an array value`);
    }
    return {
      [field]: { $nin: value },
    };
  },

  // ==================== TEXT/STRING ====================
  contains: (field: string, value: any) => ({
    [field]: { $regex: escapeRegex(String(value)), $options: "i" },
  }),

  notContains: (field: string, value: any) => ({
    [field]: { $not: { $regex: escapeRegex(String(value)), $options: "i" } },
  }),

  startsWith: (field: string, value: any) => ({
    [field]: { $regex: `^${escapeRegex(String(value))}`, $options: "i" },
  }),

  endsWith: (field: string, value: any) => ({
    [field]: { $regex: `${escapeRegex(String(value))}$`, $options: "i" },
  }),

  regex: (field: string, value: any) => {
    if (typeof value !== "string" && !value.pattern) {
      throw new Error(`"regex" operator requires a string or regex pattern`);
    }
    const pattern = value.pattern || value;
    const options = value.options || "i";
    return {
      [field]: { $regex: pattern, $options: options },
    };
  },

  // ==================== EXISTENCE ====================
  isEmpty: (field: string) => ({
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
      { [field]: [] },
    ],
  }),

  isNotEmpty: (field: string) => ({
    $and: [
      { [field]: { $exists: true } },
      { [field]: { $ne: null } },
      { [field]: { $ne: "" } },
      { [field]: { $ne: [] } },
    ],
  }),

  // ==================== DATE ====================
  dateIsBefore: (field: string, value: any) => {
    const date = ensureDate(value);
    return {
      [field]: { $lt: date },
    };
  },

  dateIsAfter: (field: string, value: any) => {
    const date = ensureDate(value);
    return {
      [field]: { $gt: date },
    };
  },

  dateIsBetween: (field: string, value: any) => {
    if (!Array.isArray(value) || value.length !== 2) {
      throw new Error(
        `"dateIsBetween" operator requires [startDate, endDate]`
      );
    }
    const [start, end] = value;
    return {
      [field]: { $gte: ensureDate(start), $lte: ensureDate(end) },
    };
  },

  // ==================== RELATIVE DATES ====================
  isRelativeToToday: (field: string, value: any) => {
    const { operator, days = 0 } = value;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const compareDate = new Date(today);
    compareDate.setDate(compareDate.getDate() + days);

    switch (operator) {
      case "today":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          [field]: { $gte: today, $lt: tomorrow },
        };

      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          [field]: { $gte: yesterday, $lt: today },
        };

      case "tomorrow":
        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        return {
          [field]: { $gte: compareDate, $lt: dayAfterTomorrow },
        };

      case "next_n_days":
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);
        return {
          [field]: { $gte: today, $lte: futureDate },
        };

      case "last_n_days":
        const pastDate = new Date(today);
        pastDate.setDate(pastDate.getDate() - days);
        return {
          [field]: { $gte: pastDate, $lte: today },
        };

      default:
        throw new Error(
          `Unknown relative date operator: ${operator}. Use: today, yesterday, tomorrow, next_n_days, last_n_days`
        );
    }
  },
};

/**
 * Operator Registry Implementation
 * Manages operator handlers with registration and retrieval
 */
export class OperatorRegistry implements IOperatorRegistry {
  private operators: Map<FilterOperator, OperatorHandler>;

  constructor() {
    this.operators = new Map(
      Object.entries(defaultOperators) as [FilterOperator, OperatorHandler][]
    );
  }

  /**
   * Register a new operator
   */
  register(operator: RegisteredOperator): void {
    if (this.operators.has(operator.name)) {
      throw new Error(
        `Operator "${operator.name}" is already registered. Override not allowed.`
      );
    }
    this.operators.set(operator.name, operator.handler);
  }

  /**
   * Get operator handler
   */
  get(name: FilterOperator): OperatorHandler | undefined {
    return this.operators.get(name);
  }

  /**
   * Get all operators
   */
  getAll(): Map<FilterOperator, OperatorHandler> {
    return new Map(this.operators);
  }

  /**
   * Check if operator is supported
   */
  supports(name: FilterOperator): boolean {
    return this.operators.has(name);
  }

  /**
   * Get list of all operator names
   */
  list(): FilterOperator[] {
    return Array.from(this.operators.keys());
  }
}

/**
 * UTILITY FUNCTIONS
 */

/**
 * Escape regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert value to Date object
 */
function ensureDate(value: any): Date {
  if (value instanceof Date) return value;
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date value: ${value}`);
  }
  return date;
}

// ============================================================================
// SINGLETON INSTANCE & FACTORY
// ============================================================================

let registryInstance: OperatorRegistry | null = null;

/**
 * Get or create singleton registry
 */
export function getOperatorRegistry(): OperatorRegistry {
  if (!registryInstance) {
    registryInstance = new OperatorRegistry();
  }
  return registryInstance;
}

/**
 * Create new registry instance (for testing)
 */
export function createOperatorRegistry(): OperatorRegistry {
  return new OperatorRegistry();
}

/**
 * Reset singleton (for testing)
 */
export function resetOperatorRegistry(): void {
  registryInstance = null;
}

/**
 * Example: How to extend with custom operators
 *
 * const registry = getOperatorRegistry();
 *
 * registry.register({
 *   name: 'customOperator' as FilterOperator,
 *   handler: (field, value) => ({
 *     [field]: { $custom: value }
 *   }),
 *   description: 'Custom operator for special use case'
 * });
 */
