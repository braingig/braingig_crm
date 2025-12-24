# Idle Detection Implementation for Time Tracker

## Overview
This document describes the implementation of idle detection functionality for the employee time tracker. The system automatically pauses the timer after 1 minute of user inactivity and resumes when the user becomes active again.

## Implementation Details

### 1. Timer Effect Dependencies Fixed
**File:** `web/src/app/dashboard/time-tracker/page.tsx:847`

**Issue:** The timer effect was missing critical dependencies, causing it not to re-trigger when timer state changed.

**Fix:** Added missing dependencies to ensure proper timer updates:
```typescript
}, [activeEntry, accumulatedTime, idleStartTime, isTimerPaused, timerStatus, pauseStartTime]);
```

### 2. Consistent Activity Detection Across Electron Services
**File:** `web/src/app/dashboard/time-tracker/page.tsx:528-540`

**Issue:** Inconsistency between browser electron service and IPC electron service in detecting active time entries.

**Fix:** Updated IPC electron service to use persistent cache like the browser service:
```typescript
const currentActiveEntry = persistentCacheRef.current || cachedActiveEntry || activeEntry;
console.log('🔍 IPC Activity check - data.type:', data.type, 'currentActiveEntry:', !!currentActiveEntry, 'isTimerPaused:', isTimerPaused);

if (data.type === 'IDLE' && currentActiveEntry) {
    console.log('🔴 IPC IDLE detected, pausing timer');
    handleTimerPause();
} else if (data.type === 'ACTIVE' && currentActiveEntry && isTimerPaused) {
    console.log('🟢 IPC ACTIVE detected, resuming timer');
    handleTimerResume();
}
```

### 3. Enhanced Timer Resume Function
**File:** `web/src/app/dashboard/time-tracker/page.tsx:1199-1225`

**Improvements:**
- Properly reset timer status to 'running' when resuming
- Added logging for inactive duration tracking
- Clear both pause start time and idle start time

```typescript
const handleTimerResume = () => {
    const currentEntry = persistentCacheRef.current || cachedActiveEntry;
    if (!currentEntry) {
        console.log('🟢 Cannot resume - no cached active entry');
        return;
    }
    
    console.log('🟢 Resuming timer after activity');
    setIsTimerPaused(false);
    setTimerStatus('running'); // Reset timer status to running
    setShowIdleNotification(false);
    
    // Calculate and add the inactive period
    if (pauseStartTime) {
        const inactiveDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
        if (inactiveDuration > 0) {
            setAccumulatedTime(prev => prev + inactiveDuration);
            console.log('🟢 Added inactive duration to accumulated time:', inactiveDuration);
        }
    }
    setPauseStartTime(null);
    setIdleStartTime(null); // Also clear idle start time
};
```

## How It Works

### 1. Electron Integration
- The system uses either `browserElectronService` or `electronService` to detect user activity
- Electron monitors mouse movements, keyboard presses, and system activity
- When no activity is detected for 1 minute, it sends an `IDLE` event
- When activity resumes, it sends an `ACTIVE` event

### 2. Timer State Management
- `isTimerPaused`: Controls whether timer calculation should run
- `timerStatus`: Shows current state ('running', 'paused', 'idle')
- `pauseStartTime`: Records when timer was paused for time calculation
- `accumulatedTime`: Tracks total inactive time to subtract from elapsed time

### 3. Timer Calculation Logic
```typescript
if (timerEntry && !isTimerPausedRef.current && timerStatus === 'running') {
    // Timer is running - update every second
    const interval = setInterval(() => {
        const start = new Date(timerEntry.startTime).getTime();
        const now = Date.now();
        const totalElapsed = Math.floor((now - start) / 1000);
        const adjustedElapsed = totalElapsed - accumulatedTime;
        setElapsed(Math.max(0, adjustedElapsed));
    }, 1000);
    return () => clearInterval(interval);
} else if (timerEntry && (isTimerPausedRef.current || timerStatus === 'idle')) {
    // Timer is paused or idle - show static time, DO NOT change state
    const start = new Date(timerEntry.startTime).getTime();
    const referenceTime = pauseStartTime || idleStartTime || Date.now();
    const totalElapsed = Math.floor((referenceTime - start) / 1000);
    const adjustedElapsed = totalElapsed - accumulatedTime;
    setElapsed(Math.max(0, adjustedElapsed));
}
```

## User Experience

### When User Goes Idle (1 minute):
1. Electron detects no activity
2. `IDLE` event is sent to the time tracker
3. Timer pauses and shows "Idle Time Detected" status
4. Orange notification appears explaining the pause
5. Time calculation stops at the moment of inactivity

### When User Becomes Active Again:
1. Electron detects activity (mouse movement, keyboard, etc.)
2. `ACTIVE` event is sent to the time tracker
3. Timer automatically resumes
4. Inactive period is calculated and added to accumulated time
5. Timer continues from where it left off

### Visual Indicators:
- **Running Timer**: Green pulsing dot with "Timer Running" status
- **Idle Timer**: Orange pause icon with "Idle Time Detected" status
- **Paused Timer**: Gray pause icon with "Timer Paused" status

## Testing

To test the idle detection functionality:

1. Start a timer entry in the time tracker
2. Wait 1 minute without any mouse or keyboard activity
3. Verify the timer pauses and shows "Idle Time Detected"
4. Move mouse or press any key
5. Verify timer resumes automatically

The system will log detailed information to the browser console, showing:
- When idle detection occurs
- When activity resumes
- Accumulated time calculations
- Timer state changes

## Troubleshooting

If idle detection is not working:

1. **Check Electron Service**: Ensure Electron app is running and accessible at `http://localhost:8765`
2. **Check Console Logs**: Look for activity event messages in browser console
3. **Verify Timer State**: Check if `isTimerPaused` and `timerStatus` are updating correctly
4. **Check Active Entry**: Ensure there's a cached active time entry when timer is running

## Backend Integration

The system also reports activity events to the backend via the `REPORT_ACTIVITY` GraphQL mutation:

```typescript
reportActivity({
    variables: {
        type: data.type, // 'IDLE' or 'ACTIVE'
        metadata: {
            idleTime: data.idleTime,
            timestamp: data.timestamp,
            source: 'electron-desktop'
        }
    }
});
```

This allows the backend to track user activity patterns for reporting and analytics.