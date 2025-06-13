/**
 * BankCompare Database Schema - Drizzle ORM
 * Extends Better Auth schema with banking comparison functionality
 */
import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  decimal,
  jsonb,
  varchar,
  uuid,
  index,
  uniqueIndex
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================================
// EXISTING BETTER AUTH TABLES (keeping your current schema)
// ============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// ============================================================================
// SUBSCRIPTION & PREMIUM FEATURES
// ============================================================================

export const userSubscription = pgTable('user_subscription', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  subscriptionType: text('subscription_type', { 
    enum: ['free', 'premium', 'pro'] 
  }).default('free').notNull(),
  subscriptionStatus: text('subscription_status', { 
    enum: ['active', 'inactive', 'trial', 'cancelled'] 
  }).default('inactive').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  subscriptionStartsAt: timestamp('subscription_starts_at'),
  subscriptionEndsAt: timestamp('subscription_ends_at'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  features: jsonb('features').$type<string[]>().default([]),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  userIdIdx: index('user_subscription_user_id_idx').on(table.userId),
  subscriptionTypeIdx: index('user_subscription_type_idx').on(table.subscriptionType),
  stripeCustomerIdx: index('user_subscription_stripe_customer_idx').on(table.stripeCustomerId),
}));

export const premiumFeature = pgTable('premium_feature', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  requiredPlan: text('required_plan', { 
    enum: ['premium', 'pro'] 
  }).notNull(),
  icon: varchar('icon', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('premium_feature_name_idx').on(table.name),
  requiredPlanIdx: index('premium_feature_required_plan_idx').on(table.requiredPlan),
}));

// ============================================================================
// BANK CORE DATA
// ============================================================================

export const bankType = pgTable('bank_type', {
  id: varchar('id', { length: 50 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
});

export const bank = pgTable('bank', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  logoUrl: text('logo_url'),
  websiteUrl: text('website_url'),
  description: text('description'),
  headquartersCountry: varchar('headquarters_country', { length: 2 }),
  foundedYear: integer('founded_year'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('bank_slug_idx').on(table.slug),
  nameIdx: index('bank_name_idx').on(table.name),
  isActiveIdx: index('bank_is_active_idx').on(table.isActive),
}));

export const bankService = pgTable('bank_service', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  bankId: text('bank_id')
    .notNull()
    .references(() => bank.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  typeId: varchar('type_id', { length: 50 })
    .notNull()
    .references(() => bankType.id),
  logoUrl: text('logo_url'),
  monthlyFeeCents: integer('monthly_fee_cents').default(0).notNull(),
  setupFeeCents: integer('setup_fee_cents').default(0).notNull(),
  minimumBalanceCents: integer('minimum_balance_cents').default(0).notNull(),
  description: text('description'),
  pros: jsonb('pros').$type<string[]>().default([]),
  cons: jsonb('cons').$type<string[]>().default([]),
  features: jsonb('features').$type<string[]>().default([]),
  rating: decimal('rating', { precision: 2, scale: 1 }).default('0').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  dataLastUpdated: timestamp('data_last_updated').$defaultFn(() => new Date()).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  bankIdIdx: index('bank_service_bank_id_idx').on(table.bankId),
  typeIdx: index('bank_service_type_idx').on(table.typeId),
  ratingIdx: index('bank_service_rating_idx').on(table.rating),
  feeIdx: index('bank_service_fee_idx').on(table.monthlyFeeCents),
  isActiveIdx: index('bank_service_is_active_idx').on(table.isActive),
  bankSlugIdx: uniqueIndex('bank_service_bank_slug_idx').on(table.bankId, table.slug),
}));

// ============================================================================
// FEATURES & COMPARISON SYSTEM
// ============================================================================

export const serviceFeature = pgTable('service_feature', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }),
  description: text('description'),
  icon: varchar('icon', { length: 100 }),
  isPremiumFeature: boolean('is_premium_feature').default(false).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
}, (table) => ({
  nameIdx: uniqueIndex('service_feature_name_idx').on(table.name),
  categoryIdx: index('service_feature_category_idx').on(table.category),
}));

export const serviceFeatureValue = pgTable('service_feature_value', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id')
    .notNull()
    .references(() => bankService.id, { onDelete: 'cascade' }),
  featureId: text('feature_id')
    .notNull()
    .references(() => serviceFeature.id, { onDelete: 'cascade' }),
  value: text('value'),
  valueType: text('value_type', { 
    enum: ['boolean', 'string', 'number', 'currency'] 
  }).default('boolean').notNull(),
  numericValue: decimal('numeric_value', { precision: 15, scale: 2 }),
  isAvailable: boolean('is_available').default(true).notNull(),
  notes: text('notes'),
}, (table) => ({
  serviceFeatureIdx: uniqueIndex('service_feature_value_service_feature_idx')
    .on(table.serviceId, table.featureId),
  serviceIdx: index('service_feature_value_service_idx').on(table.serviceId),
  featureIdx: index('service_feature_value_feature_idx').on(table.featureId),
  numericIdx: index('service_feature_value_numeric_idx').on(table.numericValue),
}));

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export const serviceReview = pgTable('service_review', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id')
    .notNull()
    .references(() => bankService.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  title: varchar('title', { length: 255 }),
  content: text('content'),
  pros: jsonb('pros').$type<string[]>().default([]),
  cons: jsonb('cons').$type<string[]>().default([]),
  verifiedCustomer: boolean('verified_customer').default(false).notNull(),
  helpfulVotes: integer('helpful_votes').default(0).notNull(),
  isFeatured: boolean('is_featured').default(false).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  serviceIdx: index('service_review_service_idx').on(table.serviceId),
  userIdx: index('service_review_user_idx').on(table.userId),
  ratingIdx: index('service_review_rating_idx').on(table.rating),
  approvedIdx: index('service_review_approved_idx').on(table.isApproved),
  createdIdx: index('service_review_created_idx').on(table.createdAt),
}));

// ============================================================================
// COMPARISONS & ANALYTICS
// ============================================================================

export const comparisonSession = pgTable('comparison_session', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'set null' }),
  sessionToken: varchar('session_token', { length: 255 }),
  serviceIds: jsonb('service_ids').$type<string[]>().notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  expiresAt: timestamp('expires_at').$defaultFn(() => 
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  ).notNull(),
}, (table) => ({
  userIdx: index('comparison_session_user_idx').on(table.userId),
  tokenIdx: index('comparison_session_token_idx').on(table.sessionToken),
  expiresIdx: index('comparison_session_expires_idx').on(table.expiresAt),
}));

export const advancedComparison = pgTable('advanced_comparison', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }),
  serviceIds: jsonb('service_ids').$type<string[]>().notNull(),
  metrics: jsonb('metrics').$type<{
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    comparison: 'better' | 'worse' | 'equal';
  }[]>().default([]),
  insights: jsonb('insights').$type<string[]>().default([]),
  recommendations: jsonb('recommendations').$type<string[]>().default([]),
  isSaved: boolean('is_saved').default(false).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  userIdx: index('advanced_comparison_user_idx').on(table.userId),
  savedIdx: index('advanced_comparison_saved_idx').on(table.isSaved),
}));

// ============================================================================
// MARKET INSIGHTS & CONTENT
// ============================================================================

export const marketInsight = pgTable('market_insight', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  category: text('category', { 
    enum: ['market-trends', 'regulatory', 'product-analysis'] 
  }).notNull(),
  isPremium: boolean('is_premium').default(false).notNull(),
  author: varchar('author', { length: 100 }),
  featuredImageUrl: text('featured_image_url'),
  tags: jsonb('tags').$type<string[]>().default([]),
  viewCount: integer('view_count').default(0).notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  slugIdx: uniqueIndex('market_insight_slug_idx').on(table.slug),
  categoryIdx: index('market_insight_category_idx').on(table.category),
  premiumIdx: index('market_insight_premium_idx').on(table.isPremium),
  publishedIdx: index('market_insight_published_idx').on(table.isPublished, table.publishedAt),
}));

// ============================================================================
// ACTIVITY TRACKING
// ============================================================================

export const userActivity = pgTable('user_activity', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id')
    .references(() => user.id, { onDelete: 'cascade' }),
  sessionToken: varchar('session_token', { length: 255 }),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }),
  resourceId: text('resource_id'),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  userIdx: index('user_activity_user_idx').on(table.userId),
  typeIdx: index('user_activity_type_idx').on(table.activityType),
  createdIdx: index('user_activity_created_idx').on(table.createdAt),
}));

// ============================================================================
// PRICING HISTORY
// ============================================================================

export const servicePricingHistory = pgTable('service_pricing_history', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  serviceId: text('service_id')
    .notNull()
    .references(() => bankService.id, { onDelete: 'cascade' }),
  monthlyFeeCents: integer('monthly_fee_cents'),
  setupFeeCents: integer('setup_fee_cents'),
  minimumBalanceCents: integer('minimum_balance_cents'),
  effectiveFrom: timestamp('effective_from').$defaultFn(() => new Date()).notNull(),
  effectiveTo: timestamp('effective_to'),
  changeReason: varchar('change_reason', { length: 255 }),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
}, (table) => ({
  serviceIdx: index('service_pricing_history_service_idx').on(table.serviceId),
  effectiveIdx: index('service_pricing_history_effective_idx').on(table.effectiveFrom),
}));

// ============================================================================
// RELATIONS
// ============================================================================

export const userRelations = relations(user, ({ one, many }) => ({
  subscription: one(userSubscription, {
    fields: [user.id],
    references: [userSubscription.userId],
  }),
  reviews: many(serviceReview),
  comparisons: many(advancedComparison),
  activities: many(userActivity),
}));

export const userSubscriptionRelations = relations(userSubscription, ({ one }) => ({
  user: one(user, {
    fields: [userSubscription.userId],
    references: [user.id],
  }),
}));

export const bankRelations = relations(bank, ({ many }) => ({
  services: many(bankService),
}));

export const bankServiceRelations = relations(bankService, ({ one, many }) => ({
  bank: one(bank, {
    fields: [bankService.bankId],
    references: [bank.id],
  }),
  type: one(bankType, {
    fields: [bankService.typeId],
    references: [bankType.id],
  }),
  reviews: many(serviceReview),
  featureValues: many(serviceFeatureValue),
  pricingHistory: many(servicePricingHistory),
}));

export const serviceReviewRelations = relations(serviceReview, ({ one }) => ({
  service: one(bankService, {
    fields: [serviceReview.serviceId],
    references: [bankService.id],
  }),
  user: one(user, {
    fields: [serviceReview.userId],
    references: [user.id],
  }),
}));

export const serviceFeatureValueRelations = relations(serviceFeatureValue, ({ one }) => ({
  service: one(bankService, {
    fields: [serviceFeatureValue.serviceId],
    references: [bankService.id],
  }),
  feature: one(serviceFeature, {
    fields: [serviceFeatureValue.featureId],
    references: [serviceFeature.id],
  }),
}));

// ============================================================================
// TYPE EXPORTS (for your TypeScript interfaces)
// ============================================================================

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type UserSubscription = typeof userSubscription.$inferSelect;
export type NewUserSubscription = typeof userSubscription.$inferInsert;

export type Bank = typeof bank.$inferSelect;
export type NewBank = typeof bank.$inferInsert;

export type BankService = typeof bankService.$inferSelect;
export type NewBankService = typeof bankService.$inferInsert;

export type ServiceReview = typeof serviceReview.$inferSelect;
export type NewServiceReview = typeof serviceReview.$inferInsert;

export type MarketInsight = typeof marketInsight.$inferSelect;
export type NewMarketInsight = typeof marketInsight.$inferInsert;

export type AdvancedComparison = typeof advancedComparison.$inferSelect;
export type NewAdvancedComparison = typeof advancedComparison.$inferInsert;
