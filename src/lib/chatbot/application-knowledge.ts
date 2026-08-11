export const applicationKnowledge = `
# Application Knowledge Base

## Overview
This is an Internship Management System. The current scope covers INTERNEES and INTERNSHIP BATCHES. Employee management is NOT currently in scope.

## Key Modules
1. **Dashboard**: Shows a high-level overview of system metrics (e.g., active internees, ongoing batches).
2. **Batches**: Allows creation and management of internship batches.
   - **Statuses**: UPCOMING (planned, not started), ACTIVE (currently ongoing), CLOSED (completed).
   - **Creation**: Requires Batch Name, Start/End Dates, Timings, and Selected Days of the Week.
3. **Internees**: Allows managing internee profiles and their assignments to batches (Tenures).
   - **Creation**: Requires basic personal details (First/Last Name, Email, Gender, City) and assigning them to a Batch.
   - **Statuses**: There is no direct "Active" status on an Internee, but they are considered active if they have a Tenure in an ACTIVE batch.

## Frequently Asked Questions

**How do I create an internee?**
Navigate to the "Internees" section from the sidebar and click "Create Internee". Fill in their personal details and assign them to an upcoming or active batch.

**How do I create a batch?**
Navigate to the "Batches" section from the sidebar and click "Create Batch". Enter the batch name, start and end dates, daily timings, and select the days of the week it operates.

**What does the active status mean?**
An "ACTIVE" batch is one that is currently ongoing. Internees belonging to this batch are considered currently active internees.

**Can I manage employees here?**
No, employee management is not currently part of the system.
`;
