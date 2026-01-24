@data @portability
Feature: Data Portability
  As a Tally user
  I want to export and import my data
  So that I own my data and can back it up or migrate it

  Background:
    Given I am logged in as a registered user

  # -------------------------------------------------------------------
  # Journey: Exporting Data
  # -------------------------------------------------------------------

  @export
  Scenario: Exporting all data as JSON
    Given I have 3 challenges with 200 total entries
    When I navigate to Settings
    And I tap "Export data"
    And I select "JSON" format
    Then a file should download with naming convention "tally-export-YYYY-MM-DD.json"
    And the export should contain 3 challenges
    And the export should contain 200 entries
    And all challenge metadata should be preserved
    And all entry details should be preserved

  @export @csv
  Scenario: Exporting all data as CSV
    Given I have challenges and entries
    When I tap "Export data"
    And I select "CSV" format
    Then a ZIP file should download containing:
      | file            | contents                    |
      | challenges.csv  | All challenge data          |
      | entries.csv     | All entries with references |
    And the CSV should be compatible with spreadsheet apps

  @export @content
  Scenario: Verifying export content completeness
    Given I have a challenge with:
      | name       | Push-ups           |
      | target     | 10000              |
      | timeframe  | year               |
      | color      | red                |
      | public     | false              |
      | countType  | sets               |
      | unitLabel  | reps               |
    And the challenge has entries with notes and feelings
    When I export my data as JSON
    Then the export should include:
      | field     | present |
      | id        | yes     |
      | name      | yes     |
      | target    | yes     |
      | timeframe | yes     |
      | color     | yes     |
      | public    | yes     |
      | countType | yes     |
      | unitLabel | yes     |
      | entries   | yes     |
    And each entry should include:
      | field   | present |
      | count   | yes     |
      | date    | yes     |
      | note    | yes (if set) |
      | feeling | yes (if set) |
      | sets    | yes (if set) |
    And dashboard config should be included:
      | field             | present |
      | panels.highlights | yes     |
      | panels.progressGraph | yes  |

  @export @offline-user
  Scenario: Offline user can export local data
    Given I am an offline user with local data
    When I export my data
    Then the export should work from local storage
    And I should have a backup even without an account

  # -------------------------------------------------------------------
  # Journey: Importing Data
  # -------------------------------------------------------------------

  @import
  Scenario: Importing data from JSON export
    Given I have 1 challenge with 50 entries
    And I have a valid export file with 3 challenges and 200 entries
    When I navigate to Settings
    And I tap "Import data"
    And I select my export file
    Then I should see import preview:
      | challenges | 3   |
      | entries    | 200 |
    When I confirm the import
    Then I should see import success message
    And I should have 3 challenges (replacing existing)
    And I should have 200 entries

  @import @validation
  Scenario: Import validates file format
    Given I have an invalid or corrupted file
    When I try to import it
    Then I should see import error "Invalid file format"
    And my existing data should be unchanged
    And I should be able to try again with a valid file

  @import @replace-all
  Scenario: Import uses replace-all semantics
    Given I have existing challenges "A" and "B"
    And I import a file with challenges "C" and "D"
    When the import completes
    Then I should have only challenges "C" and "D"
    And challenges "A" and "B" should no longer exist
    And I should have been warned about replacement before confirming

  @import @id-mapping
  Scenario: Import correctly maps challenge IDs in entries
    Given I import a file where entries reference challenge IDs
    When the import processes
    Then new challenge IDs should be generated
    And entries should be remapped to the new challenge IDs
    And no orphaned entries should exist

  @import @error-reporting
  Scenario: Import reports specific errors
    Given I have a partially valid import file with:
      | valid challenges | 2                |
      | invalid entry    | missing date     |
      | invalid entry    | negative count   |
    When I import the file
    Then I should see a detailed error report:
      | line/item | error                   |
      | Entry #47 | Missing required: date  |
      | Entry #83 | Invalid: negative count |
    And I should have the option to:
      | option              | action                    |
      | Import valid only   | Skip invalid items        |
      | Cancel              | Abort entire import       |

  # -------------------------------------------------------------------
  # Journey: Clearing All Data
  # -------------------------------------------------------------------

  @clear
  Scenario: Clearing all data with confirmation
    Given I have 3 challenges and 200 entries
    When I navigate to Settings
    And I tap "Clear all data"
    Then I should see a confirmation dialog:
      """
      This will permanently delete all your challenges, entries, and follows.
      This action cannot be undone.
      
      Are you sure you want to clear all data?
      """
    When I type "DELETE" to confirm
    And I tap "Clear all data"
    Then all challenges should be removed
    And all entries should be removed
    And all follows should be removed
    And I should see an empty dashboard

  @clear @requires-confirmation
  Scenario: Clear requires explicit confirmation
    When I tap "Clear all data"
    And the confirmation appears
    If I tap "Cancel"
    Then my data should be unchanged
    And I should return to settings

  @clear @offline
  Scenario: Clearing local data for offline users
    Given I am an offline user with local data
    When I clear all data
    Then local storage should be emptied
    And I should see the fresh empty state
    And I can start over as a new user

  # -------------------------------------------------------------------
  # Journey: Data Portability Workflow
  # -------------------------------------------------------------------

  @workflow @backup
  Scenario: Creating a backup before making changes
    Given I want to try something risky
    When I export my data first
    And then make changes
    If something goes wrong
    Then I can import my backup to restore

  @workflow @migration
  Scenario: Migrating to a new account
    Given I have data on account A
    When I export data from account A
    And I create a new account B
    And I import the export file into account B
    Then all my challenges and entries should be on account B
    And I can continue using Tally seamlessly

  @workflow @device-transfer
  Scenario: Transferring data to a new device (offline user)
    Given I am an offline user on Device A
    When I export my data to a file
    And I transfer the file to Device B
    And I import the file on Device B
    Then all my data should be on Device B
    # Note: For registered users, just sign in—no export needed
