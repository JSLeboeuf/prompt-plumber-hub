# TypeScript 'any' Type Fixes

## Phase 1: Services & API Layer (Critical Priority)

### BaseService.ts
- [ ] Fix `query: any` parameters in buildFilters, applySorting, applyPagination methods
- [ ] Add proper Supabase QueryBuilder types

### ApiServiceManager.ts
- [ ] Fix `data: any` parameters in HTTP methods (post, put)
- [ ] Fix `options?: any` parameters
- [ ] Fix `context?: any` in makeCall method
- [ ] Fix `data: any` in triggerWorkflow
- [ ] Fix `operations: any[]` in batch method
- [ ] Fix `metrics: any` property
- [ ] Fix deepMerge method parameters

### api.ts
- [ ] Fix `context: any` in startCall method
- [ ] Fix `data: any` in triggerWorkflow method
- [ ] Fix `payload: any` in subscription callbacks
- [ ] Fix `channel: any` in unsubscribe method

### webhooks.ts
- [ ] Fix workflow method parameters (clientData, callData, interventionData, feedbackData)

### CRM Client Service
- [ ] Fix subscription callback parameters
- [ ] Fix update methods with proper types
- [ ] Fix query result types

## Phase 2: Hooks & React Layer

### useRealtimeSubscription.ts
- [ ] Fix `payload: any` in callback types
- [ ] Add proper realtime payload types

### useWebSocket.ts
- [ ] Fix `data?: any` in WebSocketMessage interface
- [ ] Fix message, data, alert handler parameters

### useProductionData.ts
- [ ] Fix `metadata?: any` in CallData interface
- [ ] Fix payload and updates parameters

### useClientActions.ts & useInterventions.ts
- [ ] Fix mock function parameters with proper types

### useDebounce.ts
- [ ] Fix generic function type constraint

## Phase 3: Components & UI Layer

### Client Components
- [ ] Fix `service_history?: any[]` in ClientCard, ClientTable, ClientDialog
- [ ] Create proper ServiceHistory type

### CRM Components
- [ ] Fix MetricCard, AlertItem component prop types
- [ ] Fix intervention and sms mapping types

### Pages
- [ ] Fix selectedClient state type in CRM.tsx
- [ ] Fix compliance data types in Conformite.tsx
- [ ] Fix intervention types in Interventions.tsx

## Phase 4: Configuration & Utils

### Middleware & Security
- [ ] Fix server middleware parameter types
- [ ] Fix request/response/next parameter types

### Performance & Utils
- [ ] Fix decorator constructor type
- [ ] Fix scoring utility service_history type

## Phase 5: Type Definitions Enhancement

### New Type Definitions Needed
- [ ] ServiceHistory interface
- [ ] WebSocket message payload types
- [ ] Supabase query builder proper types
- [ ] Middleware types
- [ ] Component prop interfaces
- [ ] Realtime subscription payload types
- [ ] Webhook payload types

### Type Utilities
- [ ] Create proper type guards
- [ ] Add validation schemas
- [ ] Improve error handling types