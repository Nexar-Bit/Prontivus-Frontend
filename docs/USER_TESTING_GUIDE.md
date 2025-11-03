# User Testing Guide for Prontivus

Comprehensive guide for conducting user testing sessions with healthcare professionals and patients.

## Table of Contents

1. [Healthcare Professional Testing](#healthcare-professional-testing)
2. [Patient Usability Testing](#patient-usability-testing)
3. [Accessibility Testing](#accessibility-testing)
4. [Testing Scripts](#testing-scripts)
5. [Data Collection](#data-collection)

---

## Healthcare Professional Testing

### Objectives

- Validate workflow efficiency
- Identify pain points in clinical workflows
- Ensure medical data accuracy
- Verify HIPAA compliance understanding
- Test emergency/critical workflows

### Participant Selection

**Target Groups:**
- **Doctors**: 5-7 participants (various specializations)
- **Nurses**: 3-5 participants (different roles)
- **Administrative Staff**: 3-5 participants (secretaries, receptionists)
- **IT/Technical Staff**: 2-3 participants

**Selection Criteria:**
- Mix of tech-savvy and less tech-savvy users
- Various age groups (25-65)
- Different experience levels (junior to senior)
- Multiple medical specialties

### Test Scenarios

#### Scenario 1: Patient Registration (5 minutes)
**Task**: Register a new patient with complete information

**Success Criteria:**
- ✅ Complete registration in < 3 minutes
- ✅ All required fields filled correctly
- ✅ Patient appears in system immediately

**Observations:**
- Navigation clarity
- Form field understanding
- Error message clarity
- Confirmation process

#### Scenario 2: Appointment Scheduling (5 minutes)
**Task**: Schedule an appointment for an existing patient

**Success Criteria:**
- ✅ Find patient quickly (< 30 seconds)
- ✅ View available slots clearly
- ✅ Schedule appointment in < 2 minutes
- ✅ Confirmation displayed

**Observations:**
- Search functionality effectiveness
- Calendar visualization
- Doctor selection process
- Time slot clarity

#### Scenario 3: Clinical Note Entry (10 minutes)
**Task**: Document a patient consultation using SOAP format

**Success Criteria:**
- ✅ Complete note in < 5 minutes
- ✅ All sections filled appropriately
- ✅ ICD-10 code selected correctly
- ✅ Prescription added if needed

**Observations:**
- Form organization
- Medical terminology support
- Autocomplete effectiveness
- Save/submit process

#### Scenario 4: Medical Records Review (5 minutes)
**Task**: Review complete patient medical history

**Success Criteria:**
- ✅ Find information quickly
- ✅ Timeline navigation intuitive
- ✅ Critical information highlighted
- ✅ Documents accessible

**Observations:**
- Information hierarchy
- Timeline clarity
- Search functionality
- Document access

#### Scenario 5: Prescription Management (5 minutes)
**Task**: Create and manage prescriptions

**Success Criteria:**
- ✅ Create prescription in < 2 minutes
- ✅ View active prescriptions clearly
- ✅ Print/download functional
- ✅ Medication interactions flagged

**Observations:**
- Prescription form usability
- Medication search
- Interaction warnings
- Print quality

### Feedback Questions

**Post-Task Questions:**
1. How easy was it to complete this task? (1-5 scale)
2. What was most frustrating?
3. What worked well?
4. Would you use this in your daily workflow?
5. What would you change?

**Overall Questions:**
1. How does this compare to your current system?
2. What features are missing?
3. What features are unnecessary?
4. Overall satisfaction rating (1-10)
5. Likelihood to recommend (1-10)

---

## Patient Usability Testing

### Objectives

- Ensure patient portal accessibility
- Validate self-service capabilities
- Verify information clarity
- Test mobile experience
- Confirm security understanding

### Participant Selection

**Target Groups:**
- **Active Patients**: 10-15 participants
- **Age Groups**: 25-75 (diverse range)
- **Tech Comfort**: Mix of levels
- **Medical Conditions**: Various chronic conditions

**Selection Criteria:**
- Regular healthcare users
- Mix of caregivers and patients
- Various device types (smartphone, tablet, desktop)
- Different educational backgrounds

### Test Scenarios

#### Scenario 1: Portal Access (3 minutes)
**Task**: Log into patient portal for first time

**Success Criteria:**
- ✅ Login process clear
- ✅ Account creation intuitive
- ✅ Password recovery accessible
- ✅ Security explained

**Observations:**
- Login form clarity
- Error message helpfulness
- Security assurance
- Mobile experience

#### Scenario 2: View Medical Records (5 minutes)
**Task**: Find and review recent lab results

**Success Criteria:**
- ✅ Find records in < 1 minute
- ✅ Results understandable
- ✅ Normal ranges clear
- ✅ Can download/print

**Observations:**
- Navigation intuitiveness
- Medical terminology clarity
- Visual indicators (normal/abnormal)
- Action clarity (download/print)

#### Scenario 3: Appointment Scheduling (5 minutes)
**Task**: Book a new appointment

**Success Criteria:**
- ✅ Find available dates in < 1 minute
- ✅ Book appointment in < 3 minutes
- ✅ Receive confirmation
- ✅ Calendar sync option clear

**Observations:**
- Calendar visualization
- Doctor selection
- Time slot clarity
- Confirmation process

#### Scenario 4: Prescription Refill (3 minutes)
**Task**: Request prescription refill

**Success Criteria:**
- ✅ Find active prescriptions
- ✅ Request refill in < 2 minutes
- ✅ Status tracking available
- ✅ Notification preferences clear

**Observations:**
- Prescription list clarity
- Refill request process
- Status communication
- Notification options

#### Scenario 5: Message Doctor (3 minutes)
**Task**: Send secure message to healthcare provider

**Success Criteria:**
- ✅ Find messaging feature
- ✅ Compose message in < 2 minutes
- ✅ Security indicators visible
- ✅ Sent confirmation clear

**Observations:**
- Feature discoverability
- Message composition ease
- Security communication
- Response expectations

### Mobile-Specific Testing

**Additional Scenarios:**
- Appointment check-in from mobile
- Emergency contact access
- Medication reminders
- Health tracking features

**Mobile Considerations:**
- Touch target sizes (≥44px)
- One-handed operation
- Offline capability
- Slow connection handling

---

## Accessibility Testing

### Objectives

- Verify WCAG 2.1 AA compliance
- Test with assistive technologies
- Validate keyboard navigation
- Confirm screen reader compatibility

### Test Groups

#### Group 1: Screen Reader Users
**Participants**: 3-5 users with visual impairments

**Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

**Test Scenarios:**
1. Navigate entire application
2. Complete registration form
3. Schedule appointment
4. Read medical records
5. Print documents

**Success Criteria:**
- ✅ All content readable
- ✅ Navigation logical
- ✅ Forms completable
- ✅ Error messages clear
- ✅ Time limits adjustable

#### Group 2: Keyboard-Only Users
**Participants**: 2-3 users with motor impairments

**Test Scenarios:**
1. Navigate without mouse
2. Complete forms with keyboard
3. Access all features
4. Use keyboard shortcuts

**Success Criteria:**
- ✅ All features accessible
- ✅ Focus indicators visible
- ✅ Tab order logical
- ✅ Skip links available
- ✅ Keyboard shortcuts work

#### Group 3: Low Vision Users
**Participants**: 2-3 users with low vision

**Test Scenarios:**
1. Zoom to 200%
2. Use high contrast mode
3. Adjust text size
4. View with color blindness filters

**Success Criteria:**
- ✅ Content readable at 200% zoom
- ✅ No content loss
- ✅ Layout remains functional
- ✅ Colors distinguishable

### Testing Checklist

- [ ] All images have alt text
- [ ] Forms have labels
- [ ] Headings in logical order
- [ ] Focus indicators visible
- [ ] Color contrast sufficient (4.5:1)
- [ ] Time limits adjustable or removed
- [ ] Errors identified and described
- [ ] Navigation consistent
- [ ] Keyboard accessible
- [ ] Screen reader compatible

---

## Testing Scripts

### Moderator Script (Healthcare Professionals)

**Introduction (2 minutes)**
```
Thank you for participating in this testing session. 
We're evaluating Prontivus, a healthcare management system.

Today you'll complete several tasks that represent 
common workflows. There are no right or wrong answers - 
we're testing the system, not you.

Please think aloud as you work. If something is confusing 
or frustrating, please say so. If you have questions, 
ask me - I'm here to help.

This session will take about 45 minutes. We're recording 
for analysis purposes only.
```

**Between Tasks**
```
Great job. How did that feel?
[Allow feedback]

Let's move to the next task: [Task Description]
```

**Closing (5 minutes)**
```
Thank you for your time. A few final questions:

1. Overall, how would you rate the system? (1-10)
2. Would you use this in your daily work?
3. What would make it better?
4. Any other comments?

Thank you for your valuable feedback!
```

### Moderator Script (Patients)

**Introduction (2 minutes)**
```
Thanks for helping us test the Prontivus patient portal.

Today you'll use the portal to complete some tasks 
that patients typically do - like viewing records 
or scheduling appointments.

Please think aloud. If something doesn't make sense, 
tell me. I'm here to help if you get stuck.

This will take about 30 minutes. We're recording 
to help improve the system.
```

**Closing (3 minutes)**
```
Thank you! A few quick questions:

1. How easy was the portal to use? (1-10)
2. Would you use this regularly?
3. What was most confusing?
4. What did you like best?

Thanks for your feedback!
```

---

## Data Collection

### Metrics to Track

#### Quantitative Metrics

**Task Completion**
- Completion rate (%)
- Time to complete
- Number of errors
- Clicks/interactions

**Satisfaction**
- System Usability Scale (SUS)
- Net Promoter Score (NPS)
- Task ease rating
- Overall satisfaction

**Accessibility**
- Screen reader navigation time
- Keyboard navigation efficiency
- Error rate with assistive tech
- Contrast ratio compliance

#### Qualitative Metrics

**Observations**
- Frustration points
- Moments of delight
- Workarounds used
- Questions asked
- Confusion indicators

**Feedback**
- Open-ended responses
- Feature requests
- Improvement suggestions
- Comparison to current systems

### Reporting Template

```
# User Testing Report - [Date]

## Executive Summary
- Participants: X healthcare professionals, Y patients
- Overall satisfaction: X.X/10
- Task completion rate: XX%
- Key findings: [3-5 bullet points]

## Healthcare Professional Testing
- Participants: X
- Average task completion: XX%
- Average time per task: X minutes
- Key issues: [List]
- Recommendations: [List]

## Patient Testing
- Participants: Y
- Average task completion: YY%
- Average time per task: Y minutes
- Key issues: [List]
- Recommendations: [List]

## Accessibility Testing
- Screen reader compatibility: XX%
- Keyboard navigation: XX%
- WCAG compliance: [Level]
- Issues found: [List]

## Action Items
1. [Priority issue]
2. [Priority issue]
3. [Priority issue]
```

---

## Follow-Up

### Immediate Actions (< 1 week)
- Critical bugs fixed
- High-priority UX issues addressed
- Security concerns resolved

### Short-Term (1-2 weeks)
- Major usability improvements
- Accessibility enhancements
- Performance optimizations

### Long-Term (1+ month)
- Feature additions based on feedback
- Workflow refinements
- Major redesigns if needed

---

**Last Updated**: 2024-01-01

