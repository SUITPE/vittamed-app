# VT-37: Reservar cita online - Implementation Plan

## Current Analysis

VT-37 builds upon the completed VT-36 (service-member associations) and VT-18 (member availability) to provide a complete online booking system that supports both doctors and members.

## Implementation Approach

Since VT-36 and VT-18 have already implemented the backend APIs with full validation, VT-37 needs to:

1. **Update the booking interface** to support provider type selection (doctor or member)
2. **Integrate VT-36 APIs** to show available members for selected services
3. **Integrate VT-18 APIs** to show member availability and time slots
4. **Use the enhanced appointment API** that already supports member_id and all validations

## Key Changes Made to Booking Page

### 1. Enhanced Form Interface
- Added `provider_type: 'doctor' | 'member' | ''` to booking form
- Added `member_id` field alongside existing `doctor_id`
- Added `Member` interface and `members` state array

### 2. Updated Data Fetching Logic
- **Service Selection**: Now fetches both doctors and available members for the service
- **Provider Selection**: Dynamic UI that shows doctors OR members based on service availability
- **Availability Generation**: Uses VT-18 member availability API for time slots

### 3. New API Integration Functions
```typescript
// VT-37: Fetch available members using VT-36 API
async function fetchAvailableMembers(serviceId: string, tenantId: string)

// VT-37: Fetch member time slots using VT-18 API
async function fetchMemberAvailability(memberId: string, date: string, tenantId: string)
```

### 4. Enhanced Appointment Creation
- Updated flow context to conditionally set `doctor_id` OR `member_id`
- Appointment API already handles member validation from VT-36 and VT-18
- Full validation chain: service authorization + availability + break conflicts

## Benefits of This Approach

1. **Leverages Existing APIs**: Uses the robust validation from VT-36 and VT-18
2. **Maintains Compatibility**: Existing doctor booking still works unchanged
3. **Progressive Enhancement**: Members appear as additional options when available
4. **Full Validation**: All VT-36 and VT-18 validations apply automatically

## User Flow

1. **Select Tenant** → Loads services
2. **Select Service** → Shows available doctors AND members for that service
3. **Select Provider Type** → Choose between doctor or member
4. **Select Provider** → Pick specific doctor or member
5. **Select Date** → Pick appointment date
6. **Select Time** → See available slots (respects provider availability)
7. **Enter Patient Info** → Complete booking form
8. **Submit** → Creates appointment with full validation

## Status

- ✅ Backend APIs ready (VT-36 + VT-18)
- ✅ Enhanced appointment creation with member support
- 🚧 Frontend booking interface updates in progress
- ⏳ UI component updates needed
- ⏳ Testing and validation needed

The implementation is on track and builds perfectly on the solid foundation provided by VT-36 and VT-18.