@challenges @smoke
Feature: Challenge Management
  As a Tally user
  I want to create and manage challenges with different timeframes
  So that I can track progress toward my goals

  Background:
    Given I am logged in as a registered user
    And I am on my dashboard

  # -------------------------------------------------------------------
  # Journey: Creating a Basic Yearly Challenge
  # -------------------------------------------------------------------

  @create @yearly
  Scenario: Creating a yearly challenge with minimal input
    When I tap the "Create challenge" button
    Then I should see the challenge creation dialog
    And the timeframe should default to "year"
    When I create a challenge with:
      | name     | target | timeframe |
      | Push-ups | 10000  | year      |
    Then I should see challenge "Push-ups" on my dashboard
    And the challenge should show progress 0/10000
    And the challenge should show pace status "on pace"
    And I should see a tally-mark success animation
    And the dialog should close automatically

  @create @yearly @full-options
  Scenario: Creating a yearly challenge with all options
    When I tap the "Create challenge" button
    And I create a challenge with:
      | name       | target | timeframe | color  | icon     | public |
      | Meditation | 365    | year      | indigo | brain    | false  |
    Then I should see challenge "Meditation" on my dashboard
    And the challenge should use the indigo color theme
    And the challenge should display the brain icon

  # -------------------------------------------------------------------
  # Journey: Creating a Monthly Challenge
  # -------------------------------------------------------------------

  @create @monthly
  Scenario: Creating a second challenge with monthly target
    Given I have a challenge named "Push-ups" with target 10000 for year
    When I tap the "Create challenge" button
    And I create a challenge with:
      | name    | target | timeframe |
      | Reading | 4      | month     |
    Then I should see 2 challenges on my dashboard
    And challenge "Reading" should show target based on current month
    And challenge "Reading" should reset progress each month

  @create @monthly @end-of-month
  Scenario Outline: Monthly challenge behavior at month boundaries
    Given today is "<date>"
    And I have a challenge named "Books" with target 4 for month
    And the challenge has 3 total entries this month
    When the month changes to "<next_month>"
    Then the challenge progress should reset to 0/4
    And the previous month's entries should be preserved in history

    Examples:
      | date       | next_month |
      | 2024-01-31 | February   |
      | 2024-12-31 | January    |

  # -------------------------------------------------------------------
  # Journey: Challenge Lifecycle
  # -------------------------------------------------------------------

  @edit
  Scenario: Editing an existing challenge
    Given I have a challenge named "Push-ups" with target 10000 for year
    When I tap on challenge "Push-ups"
    And I tap "Edit challenge"
    And I change the target to 15000
    And I tap "Save"
    Then challenge "Push-ups" should show progress with target 15000
    And my existing entries should be preserved

  @archive
  Scenario: Archiving a completed challenge
    Given I have a challenge named "2024 Push-ups" with target 10000 for year
    And the challenge has 10000 total entries
    When I tap on challenge "2024 Push-ups"
    And I tap "Archive challenge"
    Then challenge "2024 Push-ups" should not appear on my active dashboard
    And the challenge should be visible in "Archived" section
    And all entries should be preserved

  @delete
  Scenario: Deleting a challenge with confirmation
    Given I have a challenge named "Test Challenge" with target 100 for month
    When I tap on challenge "Test Challenge"
    And I tap "Delete challenge"
    Then I should see a confirmation dialog warning about data loss
    When I confirm deletion
    Then challenge "Test Challenge" should no longer exist
    And associated entries should be deleted

  # -------------------------------------------------------------------
  # Journey: Dashboard Challenge Cards
  # -------------------------------------------------------------------

  @dashboard @cards
  Scenario: Viewing challenge information on dashboard
    Given I have a challenge named "Push-ups" with target 10000 for year
    And the challenge has 1500 total entries
    And it is 45 days into the year
    When I view my dashboard
    Then the challenge card should display:
      | element        | value                    |
      | name           | Push-ups                 |
      | progress       | 1500/10000               |
      | progress ring  | ~15% filled              |
      | pace status    | ahead/on pace/behind     |
      | quick add      | visible and tappable     |

  @dashboard @pace
  Scenario Outline: Pace status calculation
    Given I have a challenge named "Push-ups" with target 10000 for year
    And it is <days> days into the year
    And the challenge has <count> total entries
    When I view my dashboard
    Then challenge "Push-ups" should show pace status "<status>"

    Examples:
      | days | count | status  |
      | 36   | 1000  | on pace |
      | 36   | 1500  | ahead   |
      | 36   | 500   | behind  |
      | 100  | 2740  | on pace |
      | 100  | 3500  | ahead   |
      | 100  | 2000  | behind  |

  # -------------------------------------------------------------------
  # Journey: Challenge Detail View
  # -------------------------------------------------------------------

  @detail @heatmap
  Scenario: Viewing challenge detail with yearly heatmap
    Given I have a challenge named "Push-ups" with target 10000 for year
    And the challenge has entries on various days
    When I tap on challenge "Push-ups"
    Then I should see the challenge detail view
    And I should see the at-a-glance header:
      | total      | current count          |
      | target     | 10000                  |
      | remaining  | target - total         |
      | days left  | remaining days in year |
      | per day    | remaining ÷ days left  |
      | pace       | ahead/on pace/behind   |
    And I should see the yearly activity heatmap
    And the heatmap should show intensity by day

  @detail @drilldown
  Scenario: Drilling down into a specific day from heatmap
    Given I have a challenge with entries on various days
    When I tap on a day in the activity heatmap
    Then I should see all entries for that day
    And I should be able to edit or delete individual entries
    And I should be able to add a new entry for that day
