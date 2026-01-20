@offline @all-platforms @smoke
Feature: Offline User Experience
  As a user who hasn't registered
  I want to use Tally without creating an account
  So that I can try the app before committing and use it anywhere

  Background:
    Given I am not logged in
    And I am using the app in offline mode

  # -------------------------------------------------------------------
  # Journey: Starting as an Offline User
  # -------------------------------------------------------------------

  @first-launch
  Scenario: Launching the app without an account
    When I open the Tally app
    Then I should see that I am not logged in
    And I should see a message indicating I can start using the app
    And I should see a local storage warning:
      """
      Your data is saved locally on this device.
      Clearing browser data or app storage will remove all your data.
      Data will not sync across devices until you create an account.
      """
    And I should see an option to "Continue without account"
    And I should see an option to "Sign in or register"

  @local-storage
  Scenario: Understanding the local storage limitation
    Given I am viewing the offline user warning
    Then the warning should be:
      | tone     | calm and informative (not scary) |
      | position | visible but not blocking         |
      | action   | dismissible after acknowledgment |
    When I tap "Continue without account"
    Then I should be able to use all core features
    And I should see a subtle indicator that I'm in local-only mode

  # -------------------------------------------------------------------
  # Journey: Full Functionality in Offline Mode
  # -------------------------------------------------------------------

  @create-challenge @offline
  Scenario: Creating challenges while offline
    Given I am using the app without an account
    When I create a challenge named "Daily Steps" with target 3650000 for year
    Then the challenge should be saved to local storage
    And I should see the challenge on my dashboard
    And the action should feel immediate (no waiting for server)

  @add-entry @offline
  Scenario: Adding entries while offline
    Given I have a challenge named "Daily Steps" with target 3650000 for year
    When I add 10000 to challenge "Daily Steps"
    Then the entry should be saved to local storage
    And the challenge progress should update immediately
    And I should see the tally-mark animation

  @persistence
  Scenario: Data persists across app restarts
    Given I have created challenges and entries while offline
    When I close and reopen the app
    Then all my challenges should still be visible
    And all my entries should be preserved
    And my progress should be accurate

  # -------------------------------------------------------------------
  # Journey: Offline Mode Indicators
  # -------------------------------------------------------------------

  @sync-status
  Scenario: Viewing sync status as an offline user
    Given I am using the app without an account
    When I view my dashboard
    Then I should see sync status indicator showing "Local only"
    And the indicator should be subtle but discoverable
    When I tap the sync status indicator
    Then I should see details about my local storage usage
    And I should see an option to "Create account to sync"

  @offline-warning
  Scenario: Reminder about data sync periodically
    Given I have been using the app offline for 7 days
    And I have more than 5 challenges or 50 entries
    When I view my dashboard
    Then I should see a gentle reminder about creating an account
    And the reminder should not be intrusive or repetitive
    And I should be able to dismiss it for 7 more days

  # -------------------------------------------------------------------
  # Journey: Cross-Platform Offline Behavior
  # -------------------------------------------------------------------

  @web @offline
  Scenario: Offline mode on web browser
    Given I am using Tally in a web browser
    And I am not logged in
    Then data should be stored in browser localStorage/IndexedDB
    And I should see a warning about clearing browser data
    And the app should work even without internet connection

  @ios @offline
  Scenario: Offline mode on iOS
    Given I am using Tally on iOS
    And I am not logged in
    Then data should be stored in local app storage
    And I should see a warning about deleting the app
    And the app should work in airplane mode

  @android @offline
  Scenario: Offline mode on Android
    Given I am using Tally on Android
    And I am not logged in
    Then data should be stored in local app storage
    And I should see a warning about clearing app data
    And the app should work without internet

  # -------------------------------------------------------------------
  # Journey: Limitations Clearly Communicated
  # -------------------------------------------------------------------

  @limitations
  Scenario: Understanding what doesn't work offline
    Given I am an offline user
    When I try to access community features
    Then I should see a message that community requires an account
    And I should see an option to create an account
    And I should be able to dismiss and continue with local features

  @data-loss-prevention
  Scenario: Warning before destructive actions
    Given I am an offline user with local data
    When I attempt to clear browser data (simulated)
    Then the app should have no way to recover data
    # Note: This is a documentation scenario - app cannot prevent browser clear
    # The feature ensures users are warned upfront about this limitation
