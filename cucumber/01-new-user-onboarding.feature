@web @smoke @onboarding
Feature: New User Onboarding (Web)
  As a new visitor to Tally
  I want to understand what the app does and start using it quickly
  So that I can begin tracking my progress immediately

  Background:
    Given I am not logged in
    And I am on a supported web browser

  # -------------------------------------------------------------------
  # Journey: First Visit to Landing Page
  # -------------------------------------------------------------------

  @landing
  Scenario: Viewing the landing page for the first time
    When I navigate to "www.tally-tracker.app"
    Then I should see the landing page
    And I should see the hero section with interactive micro-demo
    And I should see the value proposition clearly
    And I should see a prominent "Start tracking" call-to-action
    And the page should feel calm and focused (no noisy animations)

  @landing @micro-demo
  Scenario: Interacting with the landing page micro-demo
    Given I am on the landing page
    When I tap the "+1" button on the micro-demo
    Then I should see a tally-mark ink stroke animation
    And the count should increment immediately
    And I should understand how the app works without signing up

  # -------------------------------------------------------------------
  # Journey: Starting to Use the App
  # -------------------------------------------------------------------

  @start
  Scenario: Clicking through to start using the app
    Given I am on the landing page
    When I tap the "Start tracking" button
    Then I should be redirected to the app dashboard
    And I should see the onboarding state for new users
    And I should see a prompt to create my first challenge

  @start @empty-state
  Scenario: Seeing the empty dashboard as a new user
    Given I have navigated to the app for the first time
    When I view my dashboard
    Then I should see an empty state with helpful guidance
    And I should see a "Create your first challenge" action
    And I should not see any error states
    And the UI should feel welcoming, not empty

  # -------------------------------------------------------------------
  # Journey: Quick Start Flow
  # -------------------------------------------------------------------

  @quick-start
  Scenario: Creating first challenge from empty state
    Given I am on the dashboard with no challenges
    When I tap "Create your first challenge"
    Then I should see the challenge creation dialog
    And the dialog should have sensible defaults
    And the required fields should be minimal (name and target)

  @quick-start
  Scenario Outline: Completing the quick start with a yearly challenge
    Given I am on the challenge creation dialog
    When I create a challenge with:
      | name   | target   | timeframe   |
      | <name> | <target> | <timeframe> |
    Then I should see challenge "<name>" on my dashboard
    And the challenge should show progress 0/<target>
    And I should see a success feedback (tally-mark animation)
    And I should be prompted to add my first entry

    Examples:
      | name      | target | timeframe |
      | Push-ups  | 10000  | year      |
      | Reading   | 52     | year      |
      | Meditation| 365    | year      |

  # -------------------------------------------------------------------
  # Journey: Understanding the Interface
  # -------------------------------------------------------------------

  @orientation
  Scenario: Understanding the dashboard layout
    Given I have created my first challenge
    When I view my dashboard
    Then I should see:
      | element              | purpose                           |
      | Challenge card       | Shows progress and quick actions  |
      | Progress indicator   | Visual progress toward target     |
      | Pace status          | Ahead / on pace / behind          |
      | Add entry button     | Quick access to log progress      |

  @orientation @progressive-disclosure
  Scenario: Discovering additional features progressively
    Given I am a new user on the dashboard
    Then I should not be overwhelmed with options
    And advanced features should be hidden initially
    When I tap on a challenge card
    Then I should see additional details and options
    And I should understand what each option does
