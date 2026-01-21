@registration @auth @sync
Feature: User Registration and Data Sync
  As an offline user with local data
  I want to create an account and sync my data
  So that my progress is preserved and accessible everywhere

  Background:
    Given I have been using Tally without an account

  # -------------------------------------------------------------------
  # Journey: Converting from Offline to Registered User
  # -------------------------------------------------------------------

  @convert @prompt
  Scenario: Being prompted to register after extended use
    Given I have been using Tally offline for 14 days
    And I have 3 challenges with 150 total entries
    When I view my dashboard
    Then I may see a gentle prompt to create an account
    And the prompt should mention "sync across devices"
    And I should be able to dismiss or proceed

  @convert @initiate
  Scenario: Initiating registration from settings
    Given I am an offline user with local data
    When I navigate to Settings
    And I tap "Create account"
    Then I should see the registration flow
    And I should see a message about syncing my existing data

  # -------------------------------------------------------------------
  # Journey: Registration with Email and Password
  # -------------------------------------------------------------------

  @register @email
  Scenario: Registering with email and password
    When I tap "Create account"
    And I see the registration form
    And I register with email "user@example.com" and password "SecurePass123!"
    Then I should see email verification instructions
    When I verify my email
    Then I should be logged in
    And my account should be created

  @register @validation
  Scenario Outline: Registration form validation
    When I try to register with:
      | email   | password   |
      | <email> | <password> |
    Then I should see error "<error>"

    Examples:
      | email            | password | error                          |
      | invalid-email    | Test123! | Please enter a valid email     |
      | user@example.com | short    | Password must be at least 8 characters |
      | user@example.com | nodigits | Password must include a number |

  # -------------------------------------------------------------------
  # Journey: Data Sync During Conversion
  # -------------------------------------------------------------------

  @sync @during-conversion
  Scenario: Data syncs automatically after registration
    Given I have local data:
      | challenges | entries |
      | 3          | 150     |
    When I complete registration with "user@example.com"
    Then I should see "Syncing your data..."
    And all 3 challenges should upload to the server
    And all 150 entries should upload to the server
    And I should see "Sync complete" when done
    And my local data should remain intact

  @sync @progress-indicator
  Scenario: Seeing sync progress during conversion
    Given I have 5 challenges with 500 entries locally
    When I complete registration
    Then I should see a sync progress indicator:
      | state       | display                    |
      | starting    | "Preparing to sync..."     |
      | uploading   | "Syncing 500 entries..."   |
      | finishing   | "Almost done..."           |
      | complete    | "All data synced!" ✓       |
    And I should not be blocked from using the app

  @sync @conflict-free
  Scenario: First sync has no conflicts (new account)
    Given I am a new user registering
    And I have local data that has never been synced
    When my data syncs after registration
    Then all local data should be accepted as-is
    And no merge conflicts should occur
    And server data should match local data exactly

  @sync @failure-recovery
  Scenario: Handling sync failure gracefully
    Given I have completed registration
    And the sync starts but network fails mid-way
    Then I should see "Sync interrupted - will retry"
    And my local data should be preserved
    When the network recovers
    Then sync should resume automatically
    And I should see "Sync complete" when done

  # -------------------------------------------------------------------
  # Journey: Post-Registration Experience
  # -------------------------------------------------------------------

  @post-registration
  Scenario: Dashboard after successful registration
    Given I have just completed registration and sync
    When I view my dashboard
    Then I should see all my challenges (preserved from local)
    And I should see sync status "Up to date"
    And I should now have access to community features
    And I should be able to sign in on other devices

  @cross-device
  Scenario: Accessing data on a second device
    Given I registered on my phone and synced my data
    When I sign in on my tablet with the same account
    Then I should see all my challenges
    And I should see all my entries
    And data should be identical across devices

  # -------------------------------------------------------------------
  # Journey: Alternative Registration Methods
  # -------------------------------------------------------------------

  @register @social
  Scenario Outline: Registering with social providers
    When I tap "Create account"
    And I tap "Continue with <provider>"
    Then I should be redirected to <provider> OAuth
    When I authorize Tally
    Then I should be logged in
    And my local data should sync

    Examples:
      | provider |
      | Google   |
      | Apple    |
      | GitHub   |

  # -------------------------------------------------------------------
  # Journey: Sign In (Existing User)
  # -------------------------------------------------------------------

  @signin
  Scenario: Signing in with existing account
    Given I have an existing Tally account
    When I tap "Sign in"
    And I sign in with email "user@example.com" and password "SecurePass123!"
    Then I should be logged in
    And I should see my synced challenges and entries

  @signin @merge-prompt
  Scenario: Sign in with existing local data prompts for merge
    Given I have local data from offline use
    And I have an existing account with different data
    When I sign in with my existing account
    Then I should see a prompt:
      """
      You have local data that isn't in your account.
      Would you like to merge it with your account data?
      """
    And I should have options:
      | option              | result                           |
      | Merge local data    | Combine both datasets            |
      | Keep account data   | Discard local, use server data   |
      | Keep local only     | Replace server with local        |

  # -------------------------------------------------------------------
  # Journey: Account Security
  # -------------------------------------------------------------------

  @security
  Scenario: Password requirements are enforced
    When I create an account
    Then my password must meet these requirements:
      | requirement        |
      | At least 8 characters |
      | Contains a number     |
      | Contains a letter     |
    And weak passwords should be rejected with helpful feedback

  @security @session
  Scenario: Session persists across app restarts
    Given I am logged in
    When I close and reopen the app
    Then I should still be logged in
    And I should not need to re-enter credentials
