## ADDED Requirements

### Requirement: Channel registration
The system SHALL allow notification channels to be registered with the manager.

#### Scenario: Register a new channel
- **WHEN** `registerChannel(channel)` is called with a valid channel
- **THEN** the channel SHALL be added to the manager's channel registry

#### Scenario: Prevent duplicate channel names
- **WHEN** a channel with an existing name is registered
- **THEN** it SHALL replace the previous channel with the same name

#### Scenario: Unregister a channel
- **WHEN** `unregisterChannel(channelName)` is called
- **THEN** the channel SHALL be removed from the registry

### Requirement: Broadcast notifications
The system SHALL support sending notifications to all enabled channels.

#### Scenario: Notify all enabled channels
- **WHEN** `notify(message)` is called
- **THEN** the message SHALL be sent to all channels where `enabled` is true

#### Scenario: Skip disabled channels
- **WHEN** `notify(message)` is called
- **THEN** channels where `enabled` is false SHALL NOT receive the message

#### Scenario: Concurrent channel sending
- **WHEN** `notify(message)` is called with multiple enabled channels
- **THEN** all channels SHALL be called concurrently (Promise.all)

#### Scenario: Handle channel failures gracefully
- **WHEN** one channel fails during broadcast
- **THEN** other channels SHALL still receive the notification

### Requirement: Targeted notifications
The system SHALL support sending notifications to specific channels.

#### Scenario: Send to specific channel
- **WHEN** `notifyTo(channelName, message)` is called
- **THEN** only the specified channel SHALL receive the message

#### Scenario: Handle non-existent channel
- **WHEN** `notifyTo(channelName, message)` is called with invalid channel name
- **THEN** it SHALL log a warning and return without error

### Requirement: Channel status query
The system SHALL allow querying registered channels.

#### Scenario: List all channels
- **WHEN** `getChannels()` is called
- **THEN** it SHALL return an array of all registered channels with their status
