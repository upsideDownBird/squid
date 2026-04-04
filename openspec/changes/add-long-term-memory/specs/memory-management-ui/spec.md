## ADDED Requirements

### Requirement: Memory navigation item
The system SHALL provide a "记忆" navigation item in the sidebar.

#### Scenario: Navigation item visibility
- **WHEN** user views the sidebar
- **THEN** system displays a "记忆" navigation item with an appropriate icon

#### Scenario: Navigate to memory page
- **WHEN** user clicks the "记忆" navigation item
- **THEN** system displays the memory management page

### Requirement: Memory list view
The system SHALL display all memories in a list or grid view.

#### Scenario: Display all memories
- **WHEN** user opens the memory page
- **THEN** system displays all memories with name, type, and description

#### Scenario: Empty state
- **WHEN** no memories exist
- **THEN** system displays an empty state message with instructions to create first memory

### Requirement: Memory type filtering
The system SHALL allow users to filter memories by type.

#### Scenario: Filter by type
- **WHEN** user selects a memory type filter
- **THEN** system displays only memories of that type

#### Scenario: Show all types
- **WHEN** user selects "All" filter
- **THEN** system displays memories of all types

### Requirement: Memory search
The system SHALL provide search functionality to find memories by name or content.

#### Scenario: Search by name
- **WHEN** user enters text in search box
- **THEN** system filters memories matching the search term in name or description

#### Scenario: Clear search
- **WHEN** user clears the search box
- **THEN** system displays all memories again

### Requirement: Create memory
The system SHALL provide a form to create new memories.

#### Scenario: Open create form
- **WHEN** user clicks "Create Memory" button
- **THEN** system displays a form with fields for type, name, description, and content

#### Scenario: Submit new memory
- **WHEN** user fills the form and clicks "Save"
- **THEN** system creates the memory file
- **THEN** system displays success message
- **THEN** system refreshes the memory list

#### Scenario: Validation on create
- **WHEN** user submits form with missing required fields
- **THEN** system displays validation errors
- **THEN** system does not create the memory

### Requirement: Edit memory
The system SHALL allow users to edit existing memories.

#### Scenario: Open edit form
- **WHEN** user clicks "Edit" on a memory
- **THEN** system displays a form pre-filled with current memory data

#### Scenario: Submit memory update
- **WHEN** user modifies fields and clicks "Save"
- **THEN** system updates the memory file
- **THEN** system updates the "updated" timestamp
- **THEN** system displays success message

### Requirement: Delete memory
The system SHALL allow users to delete memories with confirmation.

#### Scenario: Delete confirmation
- **WHEN** user clicks "Delete" on a memory
- **THEN** system displays a confirmation dialog

#### Scenario: Confirm deletion
- **WHEN** user confirms deletion
- **THEN** system deletes the memory file
- **THEN** system removes entry from MEMORY.md
- **THEN** system displays success message
- **THEN** system refreshes the memory list

#### Scenario: Cancel deletion
- **WHEN** user cancels deletion
- **THEN** system closes the dialog without deleting

### Requirement: Memory content preview
The system SHALL display a preview of memory content in the list view.

#### Scenario: Content truncation
- **WHEN** memory content exceeds 200 characters
- **THEN** system displays first 200 characters with "..." indicator

#### Scenario: Expand content
- **WHEN** user clicks on a memory item
- **THEN** system displays full memory content in a detail view

### Requirement: Memory metadata display
The system SHALL display memory metadata including creation and update timestamps.

#### Scenario: Show timestamps
- **WHEN** viewing memory details
- **THEN** system displays "Created" and "Last Updated" timestamps in human-readable format
