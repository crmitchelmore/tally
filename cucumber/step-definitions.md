# Step Definitions Reference

Reusable step patterns for Tally user journeys. Implementations should be platform-specific.

## Navigation Steps

```gherkin
Given I am on the {page}
Given I navigate to {url}
When I tap/click {element}
When I tap/click the {button_name} button
Then I should see the {page} page
Then I should be redirected to {page}
```

## Authentication Steps

```gherkin
Given I am not logged in
Given I am logged in as {user_type}
Given I am a new user
Given I am an offline user
When I sign in with email {email} and password {password}
When I register with email {email} and password {password}
Then I should be logged in
Then I should see the logged-out state
```

## Challenge Steps

```gherkin
Given I have no challenges
Given I have {count} challenge(s)
Given I have a challenge named {name} with target {target} for {timeframe}
When I create a challenge named {name} with target {target} for {timeframe}
When I create a challenge with:
  | name | target | timeframe | color | icon |
When I archive the challenge {name}
When I delete the challenge {name}
Then I should see challenge {name} on my dashboard
Then I should see {count} challenge(s) on my dashboard
Then the challenge {name} should show progress {current}/{target}
Then the challenge {name} should show pace status {status}
```

## Entry Steps

```gherkin
Given the challenge {name} has {count} total entries
When I add {count} to challenge {name}
When I add an entry to challenge {name} with:
  | count | date | note | feeling |
When I add an entry with sets:
  | reps |
When I try to add an entry for {date}
Then the challenge {name} should have {count} total
Then I should see the tally-mark animation
Then I should see an error {message}
```

## Dashboard Steps

```gherkin
When I view my dashboard
Then I should see my challenges section
Then I should see my followed challenges section
Then I should see the sync status as {status}
Then the dashboard should show {count} challenges
```

## Community Steps

```gherkin
Given there are {count} public challenges
When I browse community challenges
When I search for {query} in community challenges
When I follow challenge {name}
When I unfollow challenge {name}
Then I should see {count} public challenges
Then challenge {name} should be in my followed list
Then challenge {name} should not be in my followed list
```

## Data Steps

```gherkin
When I export my data as {format}
When I import data from {file}
When I clear all my data
Then the export should contain {count} challenges
Then the export should contain {count} entries
Then I should see import success message
Then I should see import error {message}
Then I should have {count} challenges
```

## Storage & Sync Steps

```gherkin
Given I am offline
Given I am online
Given I have data in local storage
When I go offline
When I come back online
Then my data should be saved to local storage
Then I should see the offline warning
Then my data should sync to the server
Then I should see {count} queued changes
```

## UI Feedback Steps

```gherkin
Then I should see a success message {message}
Then I should see an error message {message}
Then I should see a warning {message}
Then I should see the loading state
Then the action should feel immediate
```

## Date Helpers

```gherkin
Given today is {date}
Given it is {days} days into the year
When I select date {date}
When I select yesterday
When I select {days} days ago
```
