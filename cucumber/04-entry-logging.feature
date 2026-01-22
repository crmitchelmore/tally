@entries @smoke
Feature: Entry Logging
  As a Tally user
  I want to log my progress with satisfying feedback
  So that tracking feels rewarding and accurate

  Background:
    Given I am logged in
    And I have a challenge named "Push-ups" with target 10000 for year

  # -------------------------------------------------------------------
  # Journey: Adding a Basic Entry
  # -------------------------------------------------------------------

  @add @basic
  Scenario: Adding a simple entry to a challenge
    When I tap the quick-add button on challenge "Push-ups"
    And I enter count 50
    And I tap "Add"
    Then the challenge "Push-ups" should have 50 total
    And I should see the tally-mark ink stroke animation
    And the action should feel immediate (optimistic UI)
    And the dialog should close automatically

  @add @from-dashboard
  Scenario: Adding entry from dashboard quick action
    Given I am on my dashboard
    When I tap the "+" button on challenge "Push-ups"
    Then I should see the entry input
    When I add 25 to challenge "Push-ups"
    Then the challenge progress should update immediately
    And I should see the tally-mark animation

  # -------------------------------------------------------------------
  # Journey: Detailed Entry with Sets/Reps
  # -------------------------------------------------------------------

  @add @detailed @countType-sets
  Scenario: Adding entry to a challenge configured for sets tracking
    Given I have a challenge named "Push-ups" with countType "sets"
    When I open the add entry dialog for "Push-ups"
    Then I should see the sets input mode automatically
    And I should see "Set 1" input field
    And I should see an "Add set" button
    When I add an entry with sets:
      | reps |
      | 20   |
      | 15   |
    Then the entry should record a total of 35 reps
    And the entry should preserve individual set data [20, 15]

  @add @detailed
  Scenario: Adding a detailed entry with sets of reps (manual expand)
    Given I am adding an entry to challenge "Push-ups"
    When I tap "Add sets" to expand detailed mode
    And I add an entry with sets:
      | reps |
      | 20   |
      | 15   |
      | 12   |
      | 10   |
    Then the entry should record a total of 57 reps
    And the challenge "Push-ups" should have 57 total
    And the entry should preserve individual set data

  @add @detailed @extra-fields
  Scenario: Adding entry with all optional fields
    Given I am adding an entry to challenge "Push-ups"
    When I add an entry to challenge "Push-ups" with:
      | count | date       | note                | feeling |
      | 50    | 2024-03-15 | Morning workout     | 😊      |
    Then the entry should be saved with all metadata
    And I should be able to view the note and feeling later

  @add @detailed @sets-with-note
  Scenario: Combining sets with note and feeling
    When I add a detailed entry with:
      | sets          | note            | feeling |
      | 20, 15, 12    | Post-run sets   | 💪      |
    Then the entry should have:
      | total | 47             |
      | sets  | [20, 15, 12]   |
      | note  | Post-run sets  |
      | feeling | 💪           |

  # -------------------------------------------------------------------
  # Journey: Backdating Entries
  # -------------------------------------------------------------------

  @backdate
  Scenario: Adding entries for past dates
    Given today is "2024-03-20"
    When I add an entry to challenge "Push-ups" with:
      | count | date       |
      | 100   | 2024-03-19 |
    Then the entry should be recorded for "2024-03-19"
    And the challenge total should include this entry
    And the heatmap should show activity on "2024-03-19"

  @backdate @week
  Scenario: Adding entries for the past week
    Given today is "2024-03-20"
    And challenge "Push-ups" has 0 total entries
    When I add entries for the past week:
      | date       | count |
      | 2024-03-14 | 50    |
      | 2024-03-15 | 45    |
      | 2024-03-16 | 60    |
      | 2024-03-17 | 0     |
      | 2024-03-18 | 55    |
      | 2024-03-19 | 40    |
      | 2024-03-20 | 50    |
    Then the challenge "Push-ups" should have 300 total
    And the heatmap should show activity on those 6 days
    And the rest day on "2024-03-17" should show no activity

  # -------------------------------------------------------------------
  # Journey: Future Date Blocking
  # -------------------------------------------------------------------

  @future @blocked
  Scenario: Attempting to add entry for future date - rejected
    Given today is "2024-03-20"
    When I try to add an entry for "2024-03-21"
    Then I should see an error message "Cannot add entries for future dates"
    And the entry should not be saved
    And the date picker should not allow selecting future dates

  @future @boundary
  Scenario: Adding entry for today at end of day
    Given today is "2024-03-20" at 23:59 local time
    When I add an entry for "2024-03-20"
    Then the entry should be saved successfully
    And the entry date should be "2024-03-20"

  @future @timezone
  Scenario: Future date check respects user timezone
    Given my timezone is "America/Los_Angeles"
    And the UTC time is "2024-03-21 02:00"
    # Which is still 2024-03-20 19:00 in LA
    When I try to add an entry for "2024-03-20"
    Then the entry should be saved successfully
    When I try to add an entry for "2024-03-21"
    Then I should see an error "Cannot add entries for future dates"

  # -------------------------------------------------------------------
  # Journey: Entry Feedback & Animation
  # -------------------------------------------------------------------

  @feedback @animation
  Scenario: Tally-mark animation on successful entry
    When I add 5 to challenge "Push-ups"
    Then I should see the tally-mark ink stroke animation
    And the animation should draw one complete tally group (5 strokes)
    And the 5th stroke should be the diagonal slash in red

  @feedback @reduced-motion
  Scenario: Respecting reduced motion preference
    Given I have reduced motion enabled in my system settings
    When I add 5 to challenge "Push-ups"
    Then the success should show immediately (no animation)
    And I should still see clear visual feedback
    And no layout jank should occur

  @feedback @tactile
  Scenario: Entry feels tactile and satisfying
    When I add an entry
    Then the interaction should feel like making a physical mark
    And there should be appropriate haptic feedback (on supported devices)
    And the UI should respond instantly (optimistic update)

  # -------------------------------------------------------------------
  # Journey: Editing and Deleting Entries
  # -------------------------------------------------------------------

  @edit
  Scenario: Editing an existing entry
    Given I have an entry of 50 on "2024-03-15" for challenge "Push-ups"
    When I view entries for "2024-03-15"
    And I tap edit on the entry
    And I change the count to 55
    And I save the entry
    Then the entry should show 55
    And the challenge total should be updated accordingly

  @delete
  Scenario: Deleting an entry
    Given challenge "Push-ups" has 100 total entries
    And I have an entry of 50 on "2024-03-15"
    When I delete the entry from "2024-03-15"
    Then the challenge total should decrease by 50
    And the heatmap should update to reflect the change

  # -------------------------------------------------------------------
  # Journey: Multiple Entries Per Day
  # -------------------------------------------------------------------

  @multiple
  Scenario: Adding multiple entries on the same day
    Given today is "2024-03-20"
    When I add 30 to challenge "Push-ups" with note "Morning"
    And I add 25 to challenge "Push-ups" with note "Evening"
    Then the challenge should have 55 total
    And "2024-03-20" should show 2 separate entries
    And I should be able to view each entry individually

  @multiple @drilldown
  Scenario: Viewing all entries for a single day
    Given challenge "Push-ups" has multiple entries on "2024-03-15"
    When I tap on "2024-03-15" in the heatmap
    Then I should see a list of all entries for that day
    And each entry should show:
      | count | time added | note (if any) | feeling (if any) |
    And I should be able to edit or delete any entry
