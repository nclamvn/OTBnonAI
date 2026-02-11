// ═══════════════════════════════════════════════════════════════
// OTBnonAI — Shared Type Definitions
// ═══════════════════════════════════════════════════════════════

// ─── API Response Types ─────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

// ─── User & Auth ────────────────────────────────────────────────

export type UserRole = 'admin' | 'buyer' | 'merchandiser' | 'manager' | 'finance';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Budget ─────────────────────────────────────────────────────

export type BudgetStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Budget {
  id: string;
  name: string;
  code: string;
  totalBudget: number;
  committedBudget: number;
  status: BudgetStatus;
  brandId: string;
  brand?: GroupBrand;
  fiscalYear: number;
  seasonGroup?: string;
  season?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDetail {
  id: string;
  budgetId: string;
  storeId: string;
  store?: Store;
  seasonGroup: string;
  season: string;
  rexAmount: number;
  ttpAmount: number;
  totalAmount: number;
}

export interface BudgetFilters {
  fiscalYear?: number;
  brandId?: string;
  status?: BudgetStatus;
  seasonGroup?: string;
  search?: string;
}

// ─── Planning ───────────────────────────────────────────────────

export type PlanningVersionType = 'V0' | 'V1' | 'V2' | 'V3' | 'FINAL';

export interface PlanningVersion {
  id: string;
  budgetId: string;
  budget?: Budget;
  version: PlanningVersionType;
  isFinal: boolean;
  totalPlanned: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlanningDetail {
  id: string;
  planningVersionId: string;
  collectionId?: string;
  collection?: Collection;
  genderId?: string;
  gender?: Gender;
  categoryId?: string;
  category?: Category;
  percentage: number;
  amount: number;
}

// ─── Proposal ───────────────────────────────────────────────────

export type ProposalStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Proposal {
  id: string;
  budgetId: string;
  budget?: Budget;
  planningVersionId: string;
  planningVersion?: PlanningVersion;
  status: ProposalStatus;
  totalValue: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProposalProduct {
  id: string;
  proposalId: string;
  skuId: string;
  sku?: SkuCatalog;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

// ─── Master Data ────────────────────────────────────────────────

export interface GroupBrand {
  id: string;
  name: string;
  code: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  type: 'REX' | 'TTP' | 'OUTLET';
  isActive: boolean;
}

export interface Collection {
  id: string;
  name: string;
  code: string;
}

export interface Gender {
  id: string;
  name: string;
  code: string;
}

export interface Category {
  id: string;
  name: string;
  code: string;
  parentId?: string;
  subCategories?: SubCategory[];
}

export interface SubCategory {
  id: string;
  name: string;
  code: string;
  categoryId: string;
}

export interface SkuCatalog {
  id: string;
  sku: string;
  name: string;
  brandId: string;
  brand?: GroupBrand;
  categoryId: string;
  category?: Category;
  genderId: string;
  gender?: Gender;
  unitPrice: number;
  imageUrl?: string;
  isActive: boolean;
}

// ─── Approval ───────────────────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Approval {
  id: string;
  entityType: 'budget' | 'planning' | 'proposal';
  entityId: string;
  status: ApprovalStatus;
  step: number;
  approverId?: string;
  approver?: User;
  comments?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalWorkflowStep {
  id: string;
  step: number;
  name: string;
  role: UserRole;
  isRequired: boolean;
}

// ─── Ticket ─────────────────────────────────────────────────────

export type TicketStatus = 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface Ticket {
  id: string;
  budgetId: string;
  budget?: Budget;
  status: TicketStatus;
  currentStep: number;
  submittedBy?: string;
  submittedAt?: string;
  approvalHistory: ApprovalHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalHistoryItem {
  step: number;
  stepName: string;
  status: ApprovalStatus;
  approverId?: string;
  approverName?: string;
  comments?: string;
  timestamp: string;
}

// ─── UI & Component Types ───────────────────────────────────────

export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// ─── Event Handler Types ────────────────────────────────────────

export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type SelectChangeEvent = React.ChangeEvent<HTMLSelectElement>;
export type TextareaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type FormSubmitEvent = React.FormEvent<HTMLFormElement>;
export type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;
export type DivClickEvent = React.MouseEvent<HTMLDivElement>;

// ─── Utility Types ──────────────────────────────────────────────

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T> = () => Promise<T>;
