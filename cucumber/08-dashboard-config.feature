@dashboard @config
Feature: Dashboard Configuration
  As a Tally user
  I want to customize which dashboard panels are visible
  So that I can focus on the metrics that matter most to me

  Background:
    Given I am logged in as a registered user
    And I have at least one challenge with entries

  # -------------------------------------------------------------------
  # Journey: Panel Visibility
  # -------------------------------------------------------------------

  @panels @toggle
  Scenario: Toggling dashboard panels on/off
    Given I am on my dashboard
    When I tap the settings icon in the header
    Then I should see panel toggle options:
      | panel            | default |
      | Highlights       | on      |
      | Personal Records | on      |
      | Progress Graph   | on      |
    When I toggle "Personal Records" off
    Then the Personal Records panel should be hidden
    And the Highlights panel should still be visible
    And the Progress Graph should still be visible

  @panels @persist
  Scenario: Panel preferences persist across sessions
    Given I have hidden the "Progress Graph" panel
    When I close the app
    And I reopen the app
    Then the Progress Graph should still be hidden
    And my other panel preferences should be preserved

  @panels @default
  Scenario: Default panel visibility
    Given I am a new user with no saved preferences
    When I view my dashboard
    Then all panels should be visible by default:
      | Highlights       |
      | Personal Records |
      | Progress Graph   |

  # -------------------------------------------------------------------
  # Journey: Progress Visualization
  # -------------------------------------------------------------------

  @graph @filter
  Scenario: Filtering progress graph by challenge
    Given I have challenges "Push-ups" and "Sit-ups" with entries
    When I view the Progress Graph panel
    Then I should see a combined line showing all activity
    When I tap the "Push-ups" filter toggle
    Then the graph should show only Push-ups data
    And the "Sit-ups" line should be hidden

  @graph @range
  Scenario: Progress graph shows last 30 days
    Given I have entries spanning the last 60 days
    When I view the Progress Graph
    Then the graph should display the last 30 days
    And older entries should not be shown on the graph
    But they should still count toward totals

  @burnup
  Scenario: Burn-up chart shows goal progress
    Given I have a challenge with target 1000 ending in 30 days
    And I have logged 300 total so far
    When I view the challenge detail page
    Then I should see a burn-up chart showing:
      | current progress | 300  |
      | target line      | 1000 |
      | pace indicator   | visible |

  # -------------------------------------------------------------------
  # Journey: Sets Statistics
  # -------------------------------------------------------------------

  @sets @stats
  Scenario: Dashboard shows sets-specific stats for sets challenges
    Given I have a challenge with countType "sets"
    And I have logged entries with sets:
      | date       | sets       |
      | yesterday  | 25, 20, 15 |
      | 3 days ago | 22, 18, 12 |
    When I view my Personal Records
    Then I should see "Best set" showing 25
    And I should see "Avg set" showing 18.7

  @sets @no-data
  Scenario: Sets stats hidden when no sets data exists
    Given I have only simple count challenges (no sets)
    When I view my Personal Records
    Then I should not see "Best set" stat
    And I should not see "Avg set" stat

  # -------------------------------------------------------------------
  # Journey: Data Export with Config
  # -------------------------------------------------------------------

  @export @config
  Scenario: Dashboard config included in data export
    Given I have customized my panel visibility:
      | panel            | visible |
      | Highlights       | true    |
      | Personal Records | false   |
      | Progress Graph   | true    |
    When I export my data as JSON
    Then the export should include dashboardConfig
    And the config should show Personal Records as hidden

  @import @config
  Scenario: Importing data restores dashboard config
    Given I have a data export with custom dashboard config
    When I import the data file
    Then my dashboard panel preferences should be restored
    And hidden panels should remain hidden
