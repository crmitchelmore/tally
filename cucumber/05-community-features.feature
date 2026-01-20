@community @dashboard
Feature: Community Features
  As a Tally user
  I want to discover and follow public challenges
  So that I can get inspiration and see how others are progressing

  Background:
    Given I am logged in as a registered user
    And there are public challenges in the community

  # -------------------------------------------------------------------
  # Journey: Viewing the Dashboard
  # -------------------------------------------------------------------

  @dashboard
  Scenario: Viewing the complete dashboard
    Given I have 2 active challenges
    And I am following 3 public challenges
    When I view my dashboard
    Then I should see my challenges section first
    And I should see my followed challenges section
    And the layout should be clean and scannable
    And I should see quick access to add entries

  @dashboard @sections
  Scenario: Dashboard sections are clearly separated
    When I view my dashboard
    Then I should see:
      | section             | content                       |
      | My Challenges       | Active challenges I created   |
      | Following           | Public challenges I follow    |
      | Discover (optional) | Suggested public challenges   |

  @dashboard @empty
  Scenario: Dashboard with no followed challenges
    Given I am not following any public challenges
    When I view my dashboard
    Then I should not see the "Following" section
    Or I should see an empty state with "Discover challenges" link

  # -------------------------------------------------------------------
  # Journey: Browsing Community Challenges
  # -------------------------------------------------------------------

  @browse
  Scenario: Browsing public challenges
    When I navigate to "Community" or "Discover"
    Then I should see a list of public challenges
    And each challenge should show:
      | field         | description                    |
      | name          | Challenge name                 |
      | owner         | Creator's display name/avatar  |
      | total reps    | Aggregate progress             |
      | follower count| Number of followers            |
      | target        | Goal amount and timeframe      |

  @browse @search
  Scenario: Searching for specific community challenges
    Given there are public challenges named "Push-ups", "Pull-ups", "Squats"
    When I search for "push" in community challenges
    Then I should see challenges containing "push"
    And I should not see unrelated challenges

  @browse @no-private
  Scenario: Private challenges never appear in community
    Given I have created a private challenge "Secret Goals"
    When I browse community challenges
    Then I should not see "Secret Goals"
    And only challenges marked as public should be visible

  # -------------------------------------------------------------------
  # Journey: Following a Community Challenge
  # -------------------------------------------------------------------

  @follow
  Scenario: Following a public challenge
    Given there is a public challenge "100K Push-ups 2024" by @fitnessfan
    When I tap on the challenge
    And I tap "Follow"
    Then the challenge should be in my followed list
    And I should see it on my dashboard under "Following"
    And the follow action should feel immediate

  @follow @dashboard
  Scenario: Adding a community challenge to my dashboard
    Given I am browsing community challenges
    And I see a challenge "Marathon Training" that interests me
    When I tap "Follow" on "Marathon Training"
    Then I should see a success confirmation
    When I return to my dashboard
    Then "Marathon Training" should appear in my "Following" section
    And I should see the owner's progress updates

  @unfollow
  Scenario: Unfollowing a public challenge
    Given I am following challenge "100K Push-ups 2024"
    When I tap on the challenge in my following list
    And I tap "Unfollow"
    Then the challenge should be removed from my following list
    And the challenge should no longer appear on my dashboard
    And I should be able to re-follow it later

  # -------------------------------------------------------------------
  # Journey: Viewing Followed Challenge Progress
  # -------------------------------------------------------------------

  @progress
  Scenario: Viewing a followed challenge's progress
    Given I am following challenge "100K Push-ups 2024" by @fitnessfan
    And the challenge has 45000 total reps from the owner
    When I view my dashboard
    Then I should see "100K Push-ups 2024" showing 45000/100000 progress
    And I should see the owner's pace status

  @progress @real-time
  Scenario: Followed challenge updates in real-time
    Given I am following challenge "100K Push-ups 2024"
    And the owner adds 500 reps while I'm viewing
    Then the challenge progress should update automatically
    And I should not need to refresh the page

  # -------------------------------------------------------------------
  # Journey: Community Challenge Details
  # -------------------------------------------------------------------

  @detail
  Scenario: Viewing public challenge details
    Given there is a public challenge "100K Push-ups 2024" by @fitnessfan
    When I tap on the challenge
    Then I should see:
      | field          | content                       |
      | name           | 100K Push-ups 2024            |
      | owner          | @fitnessfan (name + avatar)   |
      | progress       | Current / Target              |
      | pace           | Ahead / on pace / behind      |
      | follower count | Number of followers           |
      | activity       | Heatmap or recent activity    |
    And I should see the "Follow" button (or "Following" if already following)

  @detail @read-only
  Scenario: Cannot edit someone else's challenge
    Given I am viewing a public challenge owned by another user
    Then I should not see edit or delete options
    And I can only follow/unfollow the challenge
    And I cannot add entries to their challenge

  # -------------------------------------------------------------------
  # Journey: My Public Challenges
  # -------------------------------------------------------------------

  @my-public
  Scenario: Making my challenge public
    Given I have a private challenge "Push-ups 2024"
    When I tap on the challenge
    And I tap "Edit"
    And I toggle "Make public"
    And I save
    Then the challenge should be visible in community listings
    And others should be able to follow my progress

  @my-public @followers
  Scenario: Seeing who follows my public challenge
    Given I have a public challenge "Push-ups 2024" with 5 followers
    When I view my challenge details
    Then I should see "5 followers"
    And I should feel motivated by the community interest
    # Note: We don't show individual follower identities for privacy
