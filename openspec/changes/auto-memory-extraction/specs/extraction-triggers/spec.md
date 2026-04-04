## ADDED Requirements

### Requirement: Trigger extraction after N conversation turns
The system SHALL automatically trigger memory extraction after a configurable number of conversation turns.

#### Scenario: Default trigger after 5 turns
- **WHEN** conversation reaches 5 user-assistant exchanges (10 messages)
- **THEN** system triggers extraction analysis

#### Scenario: Configurable turn count
- **WHEN** user sets extraction trigger to 10 turns in settings
- **THEN** system triggers extraction after 10 turns instead of default

#### Scenario: Reset turn counter after extraction
- **WHEN** extraction completes successfully
- **THEN** system resets turn counter to 0

### Requirement: Manual extraction trigger
The system SHALL allow users to manually trigger extraction at any time.

#### Scenario: Manual trigger via button
- **WHEN** user clicks "Extract Memories" button in chat interface
- **THEN** system immediately analyzes conversation and generates suggestions

#### Scenario: Manual trigger with no new content
- **WHEN** user triggers extraction but no new messages since last extraction
- **THEN** system shows "No new content to analyze" message

### Requirement: Automatic extraction on conversation end
The system SHALL trigger extraction when user explicitly ends conversation.

#### Scenario: Clear conversation triggers extraction
- **WHEN** user clicks "Clear Conversation" button
- **THEN** system triggers extraction before clearing history

#### Scenario: New conversation triggers extraction
- **WHEN** user starts new conversation while previous has unanalyzed messages
- **THEN** system triggers extraction for previous conversation

### Requirement: Disable automatic extraction
The system SHALL allow users to disable automatic extraction via settings.

#### Scenario: Extraction disabled
- **WHEN** user disables automatic extraction in settings
- **THEN** system only triggers extraction via manual button

#### Scenario: Re-enable extraction
- **WHEN** user re-enables automatic extraction
- **THEN** system resumes automatic triggers based on configured rules

### Requirement: Extraction cooldown period
The system SHALL enforce a minimum time between automatic extractions.

#### Scenario: Cooldown prevents frequent extractions
- **WHEN** extraction was triggered less than 5 minutes ago
- **THEN** system skips automatic trigger and waits for cooldown to expire

#### Scenario: Manual trigger bypasses cooldown
- **WHEN** user manually triggers extraction during cooldown
- **THEN** system proceeds with extraction immediately

### Requirement: Extraction on app close
The system SHALL optionally trigger extraction when app is closing.

#### Scenario: Extract on close enabled
- **WHEN** user closes app with "extract on close" setting enabled
- **THEN** system triggers extraction before shutdown

#### Scenario: Extract on close disabled
- **WHEN** user closes app with "extract on close" setting disabled
- **THEN** system shuts down without extraction

### Requirement: Show extraction status
The system SHALL indicate when extraction is in progress.

#### Scenario: Extraction in progress indicator
- **WHEN** extraction is analyzing conversation
- **THEN** system displays subtle loading indicator in chat interface

#### Scenario: Extraction complete notification
- **WHEN** extraction completes with suggestions
- **THEN** system shows notification with suggestion count
