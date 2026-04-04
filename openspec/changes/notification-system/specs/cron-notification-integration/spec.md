## ADDED Requirements

### Requirement: CronManager accepts NotificationManager
The system SHALL allow CronManager to receive a NotificationManager instance.

#### Scenario: Set notification manager
- **WHEN** `setNotificationManager(manager)` is called on CronManager
- **THEN** the manager SHALL be stored for use in task callbacks

#### Scenario: Notification manager is optional
- **WHEN** CronManager is used without a notification manager
- **THEN** it SHALL continue to work with console.log fallback

### Requirement: Cron task triggers notification
The system SHALL send notifications when cron tasks are triggered.

#### Scenario: Task sends notification on trigger
- **WHEN** a cron task reaches its scheduled time
- **THEN** it SHALL call `notificationManager.notify()` with task details

#### Scenario: Notification includes task information
- **WHEN** a cron task triggers a notification
- **THEN** the message SHALL include task ID, content, and timestamp in metadata

#### Scenario: Notification type is info
- **WHEN** a cron task triggers a notification
- **THEN** the message type SHALL be 'info'

#### Scenario: Notification title is descriptive
- **WHEN** a cron task triggers a notification
- **THEN** the title SHALL be "定时任务提醒" (Scheduled Task Reminder)

#### Scenario: Notification content is task content
- **WHEN** a cron task triggers a notification
- **THEN** the content SHALL be the task's content string

### Requirement: Fallback behavior
The system SHALL maintain backward compatibility when notification system is not configured.

#### Scenario: No notification manager configured
- **WHEN** a cron task triggers without a notification manager
- **THEN** it SHALL log to console as before

#### Scenario: Notification send fails
- **WHEN** notification manager fails to send
- **THEN** the cron task SHALL still complete successfully

## MODIFIED Requirements

### Requirement: Cron task execution callback
The system SHALL execute a callback when a cron task is triggered. Previously only logged to console, now sends notifications.

#### Scenario: Task callback sends notification
- **WHEN** a cron task reaches its scheduled time
- **THEN** it SHALL send a notification through the notification manager if available

#### Scenario: Task callback logs to console
- **WHEN** a cron task reaches its scheduled time
- **THEN** it SHALL still log to console for debugging purposes

#### Scenario: Task updates last run time
- **WHEN** a cron task callback executes
- **THEN** it SHALL update the task's lastRun timestamp

#### Scenario: Task sets running status
- **WHEN** a cron task callback starts
- **THEN** it SHALL set isRunning to true, and false when complete
